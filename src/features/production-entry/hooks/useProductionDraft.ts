import { useEffect, useMemo, useRef, useState } from 'react';
import type { ProducaoSetor } from '@/hooks/useProducaoSetor';
import type { ProductionDraftMap, ProductionEntry } from '../types/production-entry.types';
import {
  buildBaselineFromRegistros, buildRegistroIdIndex, buildRegistroMetaIndex, competenciaToDate,
} from '../domain/productionCalculations';
import { sanitizeProductionValue } from '../domain/productionValidation';
import { computeDirtyDiff } from '../domain/productionComparison';

type SaveApuracao = (params: {
  updates: { id: string; meta_diaria: number; producao_realizada: number }[];
  inserts: { setor_id: string; data_producao: string; meta_diaria: number; producao_realizada: number; unidade_medida: string }[];
}) => Promise<{ ok: boolean; updated: number; inserted: number; failedSetorIds: string[] } | null>;

interface Args {
  competencia: string;
  registros: ProducaoSetor[];
  registrosLoading: boolean;
  saveApuracao: SaveApuracao;
}

/**
 * Rascunho da apuração mensal. Diferente das ocorrências (que fazem
 * delete+insert de toda a competência via RPC), produção salva
 * incrementalmente: setores alterados que já têm registro → UPDATE; setores
 * alterados sem registro → INSERT. Não salva automaticamente a cada tecla.
 */
export function useProductionDraft({ competencia, registros, registrosLoading, saveApuracao }: Args) {
  const [baseline, setBaseline] = useState<ProductionDraftMap>({});
  const [draft, setDraft] = useState<ProductionDraftMap>({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastLoaded = useRef<string | null>(null);

  const registroIdIndex = useMemo(() => buildRegistroIdIndex(registros, competencia), [registros, competencia]);
  const unidadeIndex = useMemo(() => buildRegistroMetaIndex(registros, competencia), [registros, competencia]);

  // (Re)carrega baseline/draft ao trocar de competência (ou primeiro load / refetch).
  useEffect(() => {
    if (registrosLoading) return;
    const signature = `${competencia}:${registros.length}`;
    if (lastLoaded.current === signature) return;
    lastLoaded.current = signature;
    const b = buildBaselineFromRegistros(registros, competencia);
    setBaseline(b);
    setDraft(b);
    setError(null);
  }, [competencia, registros, registrosLoading]);

  const setField = (setorId: string, field: keyof ProductionEntry, value: unknown) => {
    setDraft((prev) => {
      const cur = prev[setorId] ?? { meta: null, realizado: null };
      return { ...prev, [setorId]: { ...cur, [field]: sanitizeProductionValue(value) } };
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

  const restoreAll = () => setDraft(baseline);

  /** Mescla entradas (importação/copiar metas) sobre o draft atual. */
  const mergeEntries = (entries: ProductionDraftMap) => setDraft((prev) => ({ ...prev, ...entries }));

  const diff = useMemo(() => computeDirtyDiff(baseline, draft), [baseline, draft]);
  const isDirty = diff.totalSetoresAlterados > 0;

  const save = async (unidadePorSetor: (setorId: string) => string): Promise<boolean> => {
    if (saving || !isDirty) return false;
    setSaving(true);
    setError(null);
    try {
      const updates: { id: string; meta_diaria: number; producao_realizada: number }[] = [];
      const inserts: { setor_id: string; data_producao: string; meta_diaria: number; producao_realizada: number; unidade_medida: string }[] = [];

      for (const setorId of diff.changedSetorIds) {
        const entry = draft[setorId];
        if (!entry) continue;
        const meta = entry.meta ?? 0;
        const realizado = entry.realizado ?? 0;
        const registroId = registroIdIndex[setorId];
        if (registroId) {
          updates.push({ id: registroId, meta_diaria: meta, producao_realizada: realizado });
        } else {
          inserts.push({
            setor_id: setorId,
            data_producao: competenciaToDate(competencia),
            meta_diaria: meta,
            producao_realizada: realizado,
            unidade_medida: unidadePorSetor(setorId) || 'unidades',
          });
        }
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
          for (const setorId of diff.changedSetorIds) {
            if (!failed.has(setorId) && !failed.has(registroIdIndex[setorId])) next[setorId] = draft[setorId];
          }
          return next;
        });
        setError('Alguns setores não foram salvos. As alterações foram mantidas.');
        return false;
      }
      setBaseline(draft);
      setLastSaved(new Date());
      return true;
    } finally {
      setSaving(false);
    }
  };

  return {
    baseline, draft, setField, restoreEntry, restoreAll, mergeEntries,
    diff, isDirty, save, saving, lastSaved, error,
    registroIdIndex, unidadeIndex,
  };
}

export type UseProductionDraftReturn = ReturnType<typeof useProductionDraft>;
