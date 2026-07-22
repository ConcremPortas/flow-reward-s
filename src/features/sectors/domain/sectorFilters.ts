// Filtros e abas da visão de setores — puros. Operam sobre SectorRow.
import { normalizeStr } from './sectorPresentation';
import type { SectorFilters, SectorRow, SectorTab } from '../types/sector.types';

export const SEM_LIDERANCA = '__sem__';

export function matchesSectorFilters(row: SectorRow, f: SectorFilters): boolean {
  if (f.search) {
    const t = normalizeStr(f.search);
    const hay = [row.nome, row.descricao, row.empresaNome, row.supervisorNome, row.encarregadoNome].map(normalizeStr).join(' ');
    if (!hay.includes(t)) return false;
  }
  if (f.empresaId !== 'todos' && (row.empresaId ?? '') !== f.empresaId) return false;
  if (f.supervisorId === SEM_LIDERANCA) { if (row.supervisorId) return false; }
  else if (f.supervisorId !== 'todos' && (row.supervisorId ?? '') !== f.supervisorId) return false;
  if (f.encarregadoId === SEM_LIDERANCA) { if (row.encarregadoId) return false; }
  else if (f.encarregadoId !== 'todos' && (row.encarregadoId ?? '') !== f.encarregadoId) return false;
  if (f.situacao !== 'todos' && row.status.status !== f.situacao) return false;
  return true;
}

export function matchesTab(row: SectorRow, tab: SectorTab): boolean {
  if (tab === 'completa') return row.status.status === 'completo';
  if (tab === 'pendencias') return row.status.status !== 'completo';
  return true;
}

export function countActiveSectorFilters(f: SectorFilters): number {
  return [
    f.empresaId !== 'todos', f.supervisorId !== 'todos', f.encarregadoId !== 'todos', f.situacao !== 'todos',
  ].filter(Boolean).length;
}

export interface SectorSummaryCounts {
  total: number;
  completos: number;
  semSupervisor: number;
  semEncarregado: number;
  semFuncionarios: number;
  comPendencia: number;
}

export function computeSummary(rows: SectorRow[]): SectorSummaryCounts {
  return {
    total: rows.length,
    completos: rows.filter(r => r.status.status === 'completo').length,
    semSupervisor: rows.filter(r => !r.supervisorId).length,
    semEncarregado: rows.filter(r => !r.encarregadoId).length,
    semFuncionarios: rows.filter(r => r.links.funcionarios === 0).length,
    comPendencia: rows.filter(r => r.status.status !== 'completo').length,
  };
}

export function tabCounts(rows: SectorRow[]): Record<SectorTab, number> {
  return {
    todos: rows.length,
    completa: rows.filter(r => r.status.status === 'completo').length,
    pendencias: rows.filter(r => r.status.status !== 'completo').length,
  };
}
