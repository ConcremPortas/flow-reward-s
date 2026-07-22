// Diff do rascunho de apuração (draft vs. baseline) — puro.
import type { ProductionDraftMap } from '../types/production-entry.types';

export interface ChangedField {
  setorId: string;
  field: 'meta' | 'realizado';
  anterior: number | null;
  novo: number | null;
}

export interface ProductionDirtyDiff {
  changedSetorIds: string[];
  changedFields: ChangedField[];
  metasAlteradas: number;
  realizadosAlterados: number;
  totalSetoresAlterados: number;
}

const eq = (a: number | null, b: number | null) => (a ?? null) === (b ?? null);

export function computeDirtyDiff(baseline: ProductionDraftMap, draft: ProductionDraftMap): ProductionDirtyDiff {
  const ids = new Set([...Object.keys(baseline), ...Object.keys(draft)]);
  const changedFields: ChangedField[] = [];
  const changedSetorIds: string[] = [];

  for (const setorId of ids) {
    const b = baseline[setorId] ?? { meta: null, realizado: null };
    const d = draft[setorId] ?? { meta: null, realizado: null };
    let changed = false;
    if (!eq(b.meta, d.meta)) {
      changedFields.push({ setorId, field: 'meta', anterior: b.meta ?? null, novo: d.meta ?? null });
      changed = true;
    }
    if (!eq(b.realizado, d.realizado)) {
      changedFields.push({ setorId, field: 'realizado', anterior: b.realizado ?? null, novo: d.realizado ?? null });
      changed = true;
    }
    if (changed) changedSetorIds.push(setorId);
  }

  return {
    changedSetorIds,
    changedFields,
    metasAlteradas: changedFields.filter((c) => c.field === 'meta').length,
    realizadosAlterados: changedFields.filter((c) => c.field === 'realizado').length,
    totalSetoresAlterados: changedSetorIds.length,
  };
}
