// Filtros, abas e resumo da visão de bases — puros.
import { normalizeForDuplicate } from './rewardBaseValidation';
import type { RewardBaseFilters, RewardBaseRow, RewardBaseTab } from '../types/reward-base.types';

function haystack(row: RewardBaseRow): string {
  const cats = row.usage.topCategorias.map(c => c.nome).join(' ');
  return normalizeForDuplicate(`${row.nome} ${row.descricao ?? ''} ${row.tipo} ${cats}`);
}

export function matchesRewardBaseFilters(row: RewardBaseRow, f: RewardBaseFilters): boolean {
  if (f.search && !haystack(row).includes(normalizeForDuplicate(f.search))) return false;
  if (f.tipo !== 'todos' && row.tipo !== f.tipo) return false;
  if (f.utilizacao === 'em_uso' && !row.usage.emUso) return false;
  if (f.utilizacao === 'sem_vinculo' && row.usage.emUso) return false;
  if (f.utilizacao === 'somente_historico' && !row.usage.somenteHistorico) return false;
  if (f.situacao !== 'todos' && row.status.status !== f.situacao) return false;
  return true;
}

export function matchesRewardBaseTab(row: RewardBaseRow, tab: RewardBaseTab): boolean {
  if (tab === 'em_uso') return row.usage.emUso;
  if (tab === 'sem_vinculo') return !row.usage.emUso;
  if (tab === 'revisar') return row.status.status === 'revisar' || row.status.status === 'config_incompleta';
  return true;
}

export function countActiveRewardBaseFilters(f: RewardBaseFilters): number {
  return [f.tipo !== 'todos', f.utilizacao !== 'todos', f.situacao !== 'todos'].filter(Boolean).length;
}

export interface RewardBaseSummaryCounts {
  total: number;
  emUso: number;
  semVinculo: number;
  aRevisar: number;
  configIncompleta: number;
}

export function computeRewardBaseSummary(rows: RewardBaseRow[]): RewardBaseSummaryCounts {
  return {
    total: rows.length,
    emUso: rows.filter(r => r.usage.emUso).length,
    semVinculo: rows.filter(r => !r.usage.emUso).length,
    aRevisar: rows.filter(r => r.status.status === 'revisar' || r.status.status === 'config_incompleta').length,
    configIncompleta: rows.filter(r => r.status.status === 'config_incompleta').length,
  };
}

export function rewardBaseTabCounts(rows: RewardBaseRow[]): Record<RewardBaseTab, number> {
  return {
    todas: rows.length,
    em_uso: rows.filter(r => r.usage.emUso).length,
    sem_vinculo: rows.filter(r => !r.usage.emUso).length,
    revisar: rows.filter(r => r.status.status === 'revisar' || r.status.status === 'config_incompleta').length,
  };
}
