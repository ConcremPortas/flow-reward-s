// Comparação de duas fórmulas — puro. Diferença por critério (sem mesclar).
import { CRITERIOS } from './rewardFormulaDefinitions';
import type { WeightMap } from './rewardFormulaWeights';

export interface WeightDiffRow {
  key: string;
  label: string;
  a: number;
  b: number;
  changed: boolean;
}

export function diffWeights(a: WeightMap, b: WeightMap): WeightDiffRow[] {
  return CRITERIOS.map(c => {
    const va = a[c.key] || 0;
    const vb = b[c.key] || 0;
    return { key: c.key, label: c.label, a: va, b: vb, changed: Math.abs(va - vb) > 0.001 };
  });
}
