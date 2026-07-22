import { useEffect, useRef, useState } from 'react';
import type { FaltaAdvertencia } from '@/hooks/useFaltasAdvertencias';
import type { OccurrenceDraftMap, OccurrenceEntry } from '../types';
import { sanitizeQuantity } from '../domain/occurrenceValidation';
import { computeDirtyDiff, type DirtyDiff } from '../domain/occurrenceComparison';

type SalvarApuracaoMensal = (
  competencia: string,
  dados: Record<string, { faltas: number; advertencias: number }>,
) => Promise<{ inserted: number } | null>;

interface UseOccurrenceDraftArgs {
  competencia: string;
  registros: FaltaAdvertencia[];
  registrosLoading: boolean;
  salvarApuracaoMensal: SalvarApuracaoMensal;
}

/** Constrói o mapa {funcionarioId: {faltas, advertencias}} a partir dos registros já salvos da competência. */
function buildBaselineFromRegistros(registros: FaltaAdvertencia[], competencia: string): OccurrenceDraftMap {
  const dataCompetencia = `${competencia}-01`;
  const map: OccurrenceDraftMap = {};
  for (const r of registros) {
    if (r.data_ocorrencia !== dataCompetencia || !r.funcionario_id) continue;
    const cur = map[r.funcionario_id] || { faltas: 0, advertencias: 0 };
    const qtd = r.quantidade || 1;
    if (r.tipo === 'falta') cur.faltas = qtd;
    if (r.tipo === 'advertencia') cur.advertencias = qtd;
    map[r.funcionario_id] = cur;
  }
  return map;
}

/**
 * Rascunho de apuração mensal. IMPORTANTE: `salvarApuracaoMensal` faz
 * delete+insert de TODA a competência — por isso o save() sempre envia o
 * estado NÃO-ZERO completo do draft (não um diff), preservando o
 * comportamento real já existente (ver auditoria).
 */
export function useOccurrenceDraft({ competencia, registros, registrosLoading, salvarApuracaoMensal }: UseOccurrenceDraftArgs) {
  const [baseline, setBaseline] = useState<OccurrenceDraftMap>({});
  const [draft, setDraft] = useState<OccurrenceDraftMap>({});
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastLoadedCompetencia = useRef<string | null>(null);
  const hasRegistrosLoadedOnce = useRef(false);

  // Recarrega baseline/draft quando a competência muda (ou no primeiro load).
  useEffect(() => {
    if (registrosLoading) return;
    hasRegistrosLoadedOnce.current = true;
    if (lastLoadedCompetencia.current === competencia) return;
    lastLoadedCompetencia.current = competencia;
    const b = buildBaselineFromRegistros(registros, competencia);
    setBaseline(b);
    setDraft(b);
    setError(null);
  }, [competencia, registros, registrosLoading]);

  const setEntry = (funcionarioId: string, field: keyof OccurrenceEntry, value: number | string) => {
    setDraft((prev) => {
      const cur = prev[funcionarioId] || { faltas: 0, advertencias: 0 };
      return { ...prev, [funcionarioId]: { ...cur, [field]: sanitizeQuantity(value) } };
    });
  };

  const restoreEntry = (funcionarioId: string) => {
    setDraft((prev) => {
      const next = { ...prev };
      if (baseline[funcionarioId]) next[funcionarioId] = baseline[funcionarioId];
      else delete next[funcionarioId];
      return next;
    });
  };

  const restoreAll = () => setDraft(baseline);

  const applyToIds = (ids: string[], fn: (entry: OccurrenceEntry) => OccurrenceEntry) => {
    setDraft((prev) => {
      const next = { ...prev };
      ids.forEach((id) => {
        const cur = next[id] || { faltas: 0, advertencias: 0 };
        next[id] = fn(cur);
      });
      return next;
    });
  };

  const bulkSetFaltas = (ids: string[], value: number) => applyToIds(ids, (e) => ({ ...e, faltas: sanitizeQuantity(value) }));
  const bulkSetAdvertencias = (ids: string[], value: number) => applyToIds(ids, (e) => ({ ...e, advertencias: sanitizeQuantity(value) }));
  const bulkAdd = (ids: string[], faltasDelta: number, advertenciasDelta: number) =>
    applyToIds(ids, (e) => ({ faltas: sanitizeQuantity(e.faltas + faltasDelta), advertencias: sanitizeQuantity(e.advertencias + advertenciasDelta) }));
  const bulkZerar = (ids: string[]) => applyToIds(ids, () => ({ faltas: 0, advertencias: 0 }));

  const diff: DirtyDiff = computeDirtyDiff(baseline, draft);
  const isDirty = diff.totalFuncionariosAlterados > 0;

  /** Payload real enviado ao salvar: todo o estado não-zero do draft (não um diff). */
  const buildSavePayload = (): Record<string, { faltas: number; advertencias: number }> => {
    const payload: Record<string, { faltas: number; advertencias: number }> = {};
    for (const [id, entry] of Object.entries(draft)) {
      if (entry.faltas > 0 || entry.advertencias > 0) payload[id] = { faltas: entry.faltas, advertencias: entry.advertencias };
    }
    return payload;
  };

  const save = async (): Promise<boolean> => {
    if (saving) return false;
    setSaving(true);
    setError(null);
    try {
      const payload = buildSavePayload();
      const result = await salvarApuracaoMensal(competencia, payload);
      if (!result) {
        setError('Não foi possível salvar a apuração. Tente novamente.');
        return false;
      }
      setBaseline(draft);
      setLastSaved(new Date());
      return true;
    } finally {
      setSaving(false);
    }
  };

  /** Substitui o draft inteiro (usado pela importação, após confirmação). */
  const replaceDraft = (next: OccurrenceDraftMap) => setDraft(next);
  /** Mescla entradas no draft atual (importação aditiva, preservando edições manuais não conflitantes). */
  const mergeDraft = (entries: OccurrenceDraftMap) => setDraft((prev) => ({ ...prev, ...entries }));

  return {
    baseline, draft, setEntry, restoreEntry, restoreAll,
    bulkSetFaltas, bulkSetAdvertencias, bulkAdd, bulkZerar,
    diff, isDirty, save, saving, lastSaved, error,
    replaceDraft, mergeDraft,
  };
}

export type UseOccurrenceDraftReturn = ReturnType<typeof useOccurrenceDraft>;
