// Pesos da fórmula — leitura/agregação puras. Apenas SOMA os campos de peso;
// NÃO recalcula regra de premiação (isso é do motor).
import type { FormulaCalculo } from '@/hooks/useFormulasCalculo';
import { CRITERIOS, type WeightKey } from './rewardFormulaDefinitions';

export type WeightMap = Record<WeightKey, number>;

/** Extrai os 11 pesos como números (null → 0). */
export function getWeights(formula: Pick<FormulaCalculo, WeightKey>): WeightMap {
  const w = {} as WeightMap;
  for (const c of CRITERIOS) w[c.key] = Number(formula[c.key] ?? 0) || 0;
  return w;
}

/** Soma dos 11 pesos (em pontos percentuais). */
export function sumWeights(w: WeightMap): number {
  return CRITERIOS.reduce((acc, c) => acc + (w[c.key] || 0), 0);
}

export interface WeightEntry { key: WeightKey; label: string; short: string; value: number }

/** Entradas ordenadas por peso desc (para "critérios principais"). */
export function weightEntries(w: WeightMap): WeightEntry[] {
  return CRITERIOS.map(c => ({ key: c.key, label: c.label, short: c.short, value: w[c.key] || 0 }))
    .sort((a, b) => b.value - a.value);
}

export function activeCriteria(w: WeightMap): WeightEntry[] {
  return weightEntries(w).filter(e => e.value > 0);
}

/** Top-N critérios com peso > 0 (para a tabela). */
export function topCriteria(w: WeightMap, n = 3): { top: WeightEntry[]; rest: number } {
  const ativos = activeCriteria(w);
  return { top: ativos.slice(0, n), rest: Math.max(0, ativos.length - n) };
}
