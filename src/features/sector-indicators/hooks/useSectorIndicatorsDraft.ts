import { useEffect, useMemo, useRef, useState } from 'react';
import type { IndicadorSetor } from '@/hooks/useIndicadoresSetor';
import type {
  IndicatorId, SectorIndicatorDraftMap, SectorIndicatorEntry,
} from '../types/sector-indicators.types';
import {
  buildBaselineFromRegistros, buildRegistroIdIndex, competenciaToDate, emptyEntry,
  makeSemMedicaoEntry, persistFieldsFromEntry,
} from '../domain/indicatorCalculations';
import { sanitizeIndicatorValue } from '../domain/indicatorValidation';
import { computeDirtyDiff } from '../domain/indicatorComparison';

type SaveApuracao = (params: {
  updates: { id: string; setorId: string; values: Record<string, number | null> }[];
  inserts: { setor_id: string; competencia: string; values: Record<string, number | null> }[];
}) => Promise<{ ok: boolean; updated: number; inserted: number; failedSetorIds: string[] } | null>;

interface Args {
  competencia: string;
  indicadores: IndicadorSetor[];
  indicadoresLoading: boolean;
  saveApuracao: SaveApuracao;
}

/**
 * Rascunho da apuração mensal dos indicadores. Não salva a cada tecla: mantém um
 * draft por setor (cinco pares meta/realizado) e salva em lote após revisão.
 * Setores alterados com registro → UPDATE; sem registro → INSERT. Percentual é
 * gravado como fração (regra legada). Suporta salvar um subconjunto de setores
 * (drawer "Salvar"/"Salvar e próximo") e falha parcial.
 */
export function useSectorIndicatorsDraft({ competencia, indicadores, indicadoresLoading, saveApuracao }: Args) {
  const [baseline, setBaseline] = useState<SectorIndicatorDraftMap>({});
  const [draft, setDraft] = useState<SectorIndicatorDraftMap>({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastLoaded = useRef<string | null>(null);

  const registroIdIndex = useMemo(() => buildRegistroIdIndex(indicadores, competencia), [indicadores, competencia]);

  // (Re)carrega baseline/draft ao trocar de competência (ou primeiro load / refetch).
  useEffect(() => {
    if (indicadoresLoading) return;
    const signature = `${competencia}:${indicadores.length}`;
    if (lastLoaded.current === signature) return;
    lastLoaded.current = signature;
    const b = buildBaselineFromRegistros(indicadores, competencia);
    setBaseline(b);
    setDraft(b);
    setError(null);
  }, [competencia, indicadores, indicadoresLoading]);

  const setField = (setorId: string, indicatorId: IndicatorId, field: 'meta' | 'realizado', value: unknown) => {
    setDraft((prev) => {
      const cur = prev[setorId] ?? emptyEntry();
      const curPair = cur[indicatorId] ?? { meta: null, realizado: null };
      return {
        ...prev,
        [setorId]: { ...cur, [indicatorId]: { ...curPair, [field]: sanitizeIndicatorValue(value) } },
      };
    });
  };

  const restoreEntry = (setorId: string) => {
    setDraft((prev) => {
      const next = { ...prev };
      if (baseline[setorId]) next[setorId] = baseline[setorId];
      else delete next[setorId];
      return next;
    });
  };

  /** Restaura um único indicador de um setor ao valor do baseline. */
  const restoreIndicator = (setorId: string, indicatorId: IndicatorId) => {
    setDraft((prev) => {
      const cur = prev[setorId] ?? emptyEntry();
      const basePair = (baseline[setorId] ?? emptyEntry())[indicatorId] ?? { meta: null, realizado: null };
      return { ...prev, [setorId]: { ...cur, [indicatorId]: basePair } };
    });
  };

  const restoreAll = () => setDraft(baseline);

  /** Mescla entradas (aplicação em massa) sobre o draft atual. */
  const mergeEntries = (entries: SectorIndicatorDraftMap) => setDraft((prev) => ({ ...prev, ...entries }));

  /** Marca "sem medição" (todos os pares 1/1) para os setores informados. */
  const markSemMedicao = (setorIds: string[]) => {
    setDraft((prev) => {
      const next = { ...prev };
      for (const id of setorIds) next[id] = makeSemMedicaoEntry();
      return next;
    });
  };

  /** Substitui a entrada inteira de um setor (usado pelo editor do drawer). */
  const setEntry = (setorId: string, entry: SectorIndicatorEntry) => {
    setDraft((prev) => ({ ...prev, [setorId]: entry }));
  };

  const diff = useMemo(() => computeDirtyDiff(baseline, draft), [baseline, draft]);
  const isDirty = diff.totalSetoresAlterados > 0;

  /** Salva. Se `onlySetorIds` for informado, persiste apenas esses setores. */
  const save = async (onlySetorIds?: string[]): Promise<boolean> => {
    if (saving) return false;
    const targetIds = onlySetorIds
      ? diff.changedSetorIds.filter((id) => onlySetorIds.includes(id))
      : diff.changedSetorIds;
    if (targetIds.length === 0) return false;

    setSaving(true);
    setError(null);
    try {
      const updates: { id: string; setorId: string; values: Record<string, number | null> }[] = [];
      const inserts: { setor_id: string; competencia: string; values: Record<string, number | null> }[] = [];

      for (const setorId of targetIds) {
        const entry = draft[setorId];
        if (!entry) continue;
        const values = persistFieldsFromEntry(entry) as unknown as Record<string, number | null>;
        const registroId = registroIdIndex[setorId];
        if (registroId) updates.push({ id: registroId, setorId, values });
        else inserts.push({ setor_id: setorId, competencia: competenciaToDate(competencia), values });
      }

      const result = await saveApuracao({ updates, inserts });
      if (!result) {
        setError('Não foi possível salvar a apuração. Tente novamente.');
        return false;
      }
      if (!result.ok) {
        // Falha parcial: mantém o draft; atualiza baseline só dos setores salvos.
        const failed = new Set(result.failedSetorIds);
        setBaseline((prev) => {
          const next = { ...prev };
          for (const setorId of targetIds) if (!failed.has(setorId)) next[setorId] = draft[setorId];
          return next;
        });
        setError('Alguns setores não foram salvos. As alterações foram mantidas.');
        return false;
      }
      // Sucesso: promove os setores salvos para o baseline (mantém demais alterações).
      setBaseline((prev) => {
        const next = { ...prev };
        for (const setorId of targetIds) next[setorId] = draft[setorId];
        return next;
      });
      setLastSaved(new Date());
      return true;
    } finally {
      setSaving(false);
    }
  };

  return {
    baseline, draft, setField, setEntry, restoreEntry, restoreIndicator, restoreAll,
    mergeEntries, markSemMedicao,
    diff, isDirty, save, saving, lastSaved, error,
    registroIdIndex,
  };
}

export type UseSectorIndicatorsDraftReturn = ReturnType<typeof useSectorIndicatorsDraft>;
