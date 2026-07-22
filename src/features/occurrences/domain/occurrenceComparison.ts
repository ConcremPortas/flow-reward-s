// Comparação/diff — funções puras (sem I/O).
import type { OccurrenceDraftMap, OccurrenceEntry } from '../types';

export interface DirtyDiffEntry {
  funcionarioId: string;
  before: OccurrenceEntry;
  after: OccurrenceEntry;
}

export interface DirtyDiff {
  changedIds: string[];
  entries: DirtyDiffEntry[];
  totalFuncionariosAlterados: number;
  totalFaltasDelta: number;
  totalAdvertenciasDelta: number;
}

const emptyEntry = (): OccurrenceEntry => ({ faltas: 0, advertencias: 0 });

/** Diferença entre o estado carregado (baseline) e o rascunho atual (draft). Só para feedback de UI — nunca é o payload de salvamento. */
export function computeDirtyDiff(baseline: OccurrenceDraftMap, draft: OccurrenceDraftMap): DirtyDiff {
  const ids = new Set([...Object.keys(baseline), ...Object.keys(draft)]);
  const entries: DirtyDiffEntry[] = [];
  let totalFaltasDelta = 0;
  let totalAdvertenciasDelta = 0;

  for (const id of ids) {
    const before = baseline[id] ?? emptyEntry();
    const after = draft[id] ?? emptyEntry();
    if (before.faltas !== after.faltas || before.advertencias !== after.advertencias) {
      entries.push({ funcionarioId: id, before, after });
      totalFaltasDelta += after.faltas - before.faltas;
      totalAdvertenciasDelta += after.advertencias - before.advertencias;
    }
  }

  return {
    changedIds: entries.map((e) => e.funcionarioId),
    entries,
    totalFuncionariosAlterados: entries.length,
    totalFaltasDelta,
    totalAdvertenciasDelta,
  };
}

/** Percentual de variação entre dois valores (null se base ausente/zero). */
export function percentVariation(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}
