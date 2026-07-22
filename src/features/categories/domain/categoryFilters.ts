// Filtros e resumo da gestão de categorias — puros.
import { normalizeForDuplicate } from './categoryValidation';
import type { CategoryFilters, CategoryRow } from '../types/category.types';

function haystack(row: CategoryRow): string {
  const bases = row.usage.topBases.map(b => b.nome).join(' ');
  const setores = row.usage.topSetores.map(s => s.nome).join(' ');
  return normalizeForDuplicate(`${row.nome} ${bases} ${setores}`);
}

export function matchesCategoryFilters(row: CategoryRow, f: CategoryFilters): boolean {
  if (f.search && !haystack(row).includes(normalizeForDuplicate(f.search))) return false;
  if (f.utilizacao === 'em_uso' && !row.usage.emUso) return false;
  if (f.utilizacao === 'sem_funcionarios' && row.usage.emUso) return false;
  if (f.utilizacao === 'em_premiacao' && !row.usage.usadaEmPremiacao) return false;
  return true;
}

export function countActiveCategoryFilters(f: CategoryFilters): number {
  return [f.utilizacao !== 'todos'].filter(Boolean).length;
}

export interface CategorySummaryCounts {
  total: number;
  funcionariosVinculados: number; // soma de funcionários únicos por categoria
  semFuncionarios: number;
  emPremiacao: number;
}

export function computeCategorySummary(rows: CategoryRow[]): CategorySummaryCounts {
  return {
    total: rows.length,
    funcionariosVinculados: rows.reduce((s, r) => s + r.usage.funcionarios, 0),
    semFuncionarios: rows.filter(r => !r.usage.emUso).length,
    emPremiacao: rows.filter(r => r.usage.usadaEmPremiacao).length,
  };
}
