// Filtros, abas e resumo da visão de faixas — puros.
import { formatCurrencyBRL } from '@/lib/formatters';
import type { BonusTierFilters, BonusTierRow, BonusTierTab } from '../types/bonus-tier.types';

function haystack(row: BonusTierRow): string {
  return `${row.nome} ${formatCurrencyBRL(row.valor)} ${row.valor}`.toLowerCase();
}

export function matchesTierFilters(row: BonusTierRow, f: BonusTierFilters): boolean {
  if (f.search && !haystack(row).includes(f.search.toLowerCase())) return false;
  if (f.utilizacao === 'em_uso' && !row.usage.emUso) return false;
  if (f.utilizacao === 'sem_vinculo' && row.usage.emUso) return false;
  if (f.situacao !== 'todos' && row.status.status !== f.situacao) return false;
  if (f.valorZero && row.valor !== 0) return false;
  if (f.comDivergencia && row.nameAnalysis.state !== 'divergente') return false;
  return true;
}

export function matchesTierTab(row: BonusTierRow, tab: BonusTierTab): boolean {
  if (tab === 'em_uso') return row.usage.emUso;
  if (tab === 'sem_vinculo') return !row.usage.emUso;
  if (tab === 'revisar') return row.status.status === 'revisar';
  return true;
}

export function countActiveTierFilters(f: BonusTierFilters): number {
  return [f.utilizacao !== 'todos', f.situacao !== 'todos', f.valorZero, f.comDivergencia].filter(Boolean).length;
}

export interface TierSummaryCounts {
  total: number;
  emUso: number;
  semVinculo: number;
  valorZero: number;
  aRevisar: number;
}

export function computeTierSummary(rows: BonusTierRow[]): TierSummaryCounts {
  return {
    total: rows.length,
    emUso: rows.filter(r => r.usage.emUso).length,
    semVinculo: rows.filter(r => !r.usage.emUso).length,
    valorZero: rows.filter(r => r.valor === 0).length,
    aRevisar: rows.filter(r => r.status.status === 'revisar').length,
  };
}

export function tierTabCounts(rows: BonusTierRow[]): Record<BonusTierTab, number> {
  return {
    todas: rows.length,
    em_uso: rows.filter(r => r.usage.emUso).length,
    sem_vinculo: rows.filter(r => !r.usage.emUso).length,
    revisar: rows.filter(r => r.status.status === 'revisar').length,
  };
}
