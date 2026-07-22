// Filtros, abas e resumo da visão de funções — puros.
import { normalizeStr } from './functionNameNormalization';
import type { FunctionFilters, FunctionRow, FunctionTab } from '../types/function.types';

function haystack(row: FunctionRow): string {
  const setores = row.usage.topSetores.map(s => s.nome).join(' ');
  return normalizeStr(`${row.nome} ${setores}`);
}

export function matchesFunctionFilters(row: FunctionRow, f: FunctionFilters): boolean {
  if (f.search && !haystack(row).includes(normalizeStr(f.search))) return false;
  if (f.utilizacao === 'em_uso' && !row.usage.emUso) return false;
  if (f.utilizacao === 'sem_vinculo' && row.usage.emUso) return false;
  if (f.utilizacao === 'somente_historico' && !row.usage.somenteHistorico) return false;
  if (f.setorId !== 'todos' && !row.setorIds.includes(f.setorId)) return false;
  if (f.situacao !== 'todos' && row.status.status !== f.situacao) return false;
  return true;
}

export function matchesFunctionTab(row: FunctionRow, tab: FunctionTab): boolean {
  if (tab === 'em_uso') return row.usage.emUso;
  if (tab === 'sem_vinculo') return !row.usage.emUso;
  if (tab === 'revisar') return row.status.status !== 'regular';
  return true;
}

export function countActiveFunctionFilters(f: FunctionFilters): number {
  return [f.utilizacao !== 'todos', f.setorId !== 'todos', f.situacao !== 'todos'].filter(Boolean).length;
}

export interface FunctionSummaryCounts {
  total: number;
  emUso: number;
  semVinculo: number;
  aRevisar: number;
  correspondencias: number; // funções com possível correspondência
}

export function computeFunctionSummary(rows: FunctionRow[]): FunctionSummaryCounts {
  return {
    total: rows.length,
    emUso: rows.filter(r => r.usage.emUso).length,
    semVinculo: rows.filter(r => !r.usage.emUso).length,
    aRevisar: rows.filter(r => r.status.status !== 'regular').length,
    correspondencias: rows.filter(r => r.status.status === 'possivel_correspondencia').length,
  };
}

export function functionTabCounts(rows: FunctionRow[]): Record<FunctionTab, number> {
  return {
    todas: rows.length,
    em_uso: rows.filter(r => r.usage.emUso).length,
    sem_vinculo: rows.filter(r => !r.usage.emUso).length,
    revisar: rows.filter(r => r.status.status !== 'regular').length,
  };
}
