// Filtros e resumo da visão de fórmulas — puros.
import { CRITERIO_LABEL } from './rewardFormulaDefinitions';
import { activeCriteria } from './rewardFormulaWeights';
import type { RewardFormulaFilters, RewardFormulaRow } from '../types/reward-formula.types';

const norm = (s: string | null | undefined) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

function haystack(row: RewardFormulaRow): string {
  const criterios = activeCriteria(row.weights).map(e => CRITERIO_LABEL[e.key as keyof typeof CRITERIO_LABEL] ?? '').join(' ');
  return norm(`${row.nome} ${row.descricao ?? ''} ${row.categoriaNome ?? ''} ${row.baseNome ?? ''} ${criterios}`);
}

export function matchesFormulaFilters(row: RewardFormulaRow, f: RewardFormulaFilters): boolean {
  if (f.search && !haystack(row).includes(norm(f.search))) return false;
  if (f.categoriaId !== 'todos' && row.categoriaId !== f.categoriaId) return false;
  if (f.baseId !== 'todos' && row.baseId !== f.baseId) return false;
  if (f.situacao !== 'todos' && row.status.status !== f.situacao) return false;
  if (f.utilizacao === 'em_uso' && !row.usage.emUso) return false;
  if (f.utilizacao === 'sem_vinculo' && row.usage.emUso) return false;
  return true;
}

export function countActiveFormulaFilters(f: RewardFormulaFilters): number {
  return [f.categoriaId !== 'todos', f.baseId !== 'todos', f.situacao !== 'todos', f.utilizacao !== 'todos'].filter(Boolean).length;
}

export interface FormulaSummaryCounts {
  total: number;
  emUso: number;
  combinacoesCobertas: number; // combinações (categoria,base) distintas cobertas
  aRevisar: number;            // incompleta | revisar | duplicidade
  incompletas: number;
  duplicidades: number;
}

export function computeFormulaSummary(rows: RewardFormulaRow[]): FormulaSummaryCounts {
  const combos = new Set<string>();
  for (const r of rows) if (r.categoriaId && r.baseId) combos.add(`${r.categoriaId}|${r.baseId}`);
  return {
    total: rows.length,
    emUso: rows.filter(r => r.usage.emUso).length,
    combinacoesCobertas: combos.size,
    aRevisar: rows.filter(r => r.status.status !== 'regular').length,
    incompletas: rows.filter(r => r.status.status === 'incompleta').length,
    duplicidades: rows.filter(r => r.status.status === 'possivel_duplicidade').length,
  };
}
