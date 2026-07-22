// Diff de presença (rascunho vs. estado inicial) — puro.
// Reaproveita percentVariation já existente (não duplica a fórmula de variação).
export { percentVariation } from '@/features/occurrences/domain/occurrenceComparison';
import type { PresenceMap } from '../types';
export type { PresenceMap };

export interface PresenceDiff {
  changedIds: string[];
  totalAlterados: number;
}

export function computePresenceDiff(baseline: PresenceMap, draft: PresenceMap): PresenceDiff {
  const ids = new Set([...Object.keys(baseline), ...Object.keys(draft)]);
  const changedIds: string[] = [];
  for (const id of ids) {
    const before = baseline[id] ?? false;
    const after = draft[id] ?? false;
    if (before !== after) changedIds.push(id);
  }
  return { changedIds, totalAlterados: changedIds.length };
}
