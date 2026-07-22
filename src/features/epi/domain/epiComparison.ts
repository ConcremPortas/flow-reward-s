// Diff de conformidade (rascunho vs. estado inicial) — puro.
// Reaproveita percentVariation já existente (não duplica a fórmula de variação).
export { percentVariation } from '@/features/occurrences/domain/occurrenceComparison';
import type { ComplianceMap } from '../types/epi.types';

export interface ComplianceDiff {
  changedIds: string[];
  totalAlterados: number;
}

export function computeComplianceDiff(baseline: ComplianceMap, draft: ComplianceMap): ComplianceDiff {
  const ids = new Set([...Object.keys(baseline), ...Object.keys(draft)]);
  const changedIds: string[] = [];
  for (const id of ids) {
    const before = baseline[id] ?? true;
    const after = draft[id] ?? true;
    if (before !== after) changedIds.push(id);
  }
  return { changedIds, totalAlterados: changedIds.length };
}
