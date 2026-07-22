// Diff do rascunho de apuração (draft vs. baseline) — puro.
import type { IndicatorId, SectorIndicatorDraftMap } from '../types/sector-indicators.types';
import { INDICATOR_IDS } from './indicatorDefinitions';
import { emptyEntry } from './indicatorCalculations';

export interface ChangedIndicatorField {
  setorId: string;
  indicatorId: IndicatorId;
  field: 'meta' | 'realizado';
  anterior: number | null;
  novo: number | null;
}

export interface IndicatorDirtyDiff {
  changedSetorIds: string[];
  changedFields: ChangedIndicatorField[];
  metasAlteradas: number;
  realizadosAlterados: number;
  indicadoresAlterados: number;      // pares (setor, indicador) com qualquer mudança
  totalSetoresAlterados: number;
}

const eq = (a: number | null, b: number | null) => (a ?? null) === (b ?? null);

export function computeDirtyDiff(baseline: SectorIndicatorDraftMap, draft: SectorIndicatorDraftMap): IndicatorDirtyDiff {
  const ids = new Set([...Object.keys(baseline), ...Object.keys(draft)]);
  const changedFields: ChangedIndicatorField[] = [];
  const changedSetorIds: string[] = [];
  let indicadoresAlterados = 0;

  for (const setorId of ids) {
    const b = baseline[setorId] ?? emptyEntry();
    const d = draft[setorId] ?? emptyEntry();
    let setorChanged = false;

    for (const indicatorId of INDICATOR_IDS) {
      const bp = b[indicatorId] ?? { meta: null, realizado: null };
      const dp = d[indicatorId] ?? { meta: null, realizado: null };
      let indicatorChanged = false;
      if (!eq(bp.meta, dp.meta)) {
        changedFields.push({ setorId, indicatorId, field: 'meta', anterior: bp.meta ?? null, novo: dp.meta ?? null });
        indicatorChanged = true;
      }
      if (!eq(bp.realizado, dp.realizado)) {
        changedFields.push({ setorId, indicatorId, field: 'realizado', anterior: bp.realizado ?? null, novo: dp.realizado ?? null });
        indicatorChanged = true;
      }
      if (indicatorChanged) { indicadoresAlterados += 1; setorChanged = true; }
    }

    if (setorChanged) changedSetorIds.push(setorId);
  }

  return {
    changedSetorIds,
    changedFields,
    metasAlteradas: changedFields.filter((c) => c.field === 'meta').length,
    realizadosAlterados: changedFields.filter((c) => c.field === 'realizado').length,
    indicadoresAlterados,
    totalSetoresAlterados: changedSetorIds.length,
  };
}
