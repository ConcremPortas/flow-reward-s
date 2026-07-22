// Filtros de apuração e histórico — puros.
import type {
  SectorIndicatorFilters, SectorIndicatorHistoryFilters, SectorIndicatorHistoryRow, SectorIndicatorRow,
} from '../types/sector-indicators.types';
import { dateToCompetencia } from './indicatorCalculations';

function matchesSearch(row: { setorNome: string; empresaNome: string | null }, term: string): boolean {
  if (!term) return true;
  const t = term.toLowerCase();
  return row.setorNome.toLowerCase().includes(t) || (row.empresaNome ?? '').toLowerCase().includes(t);
}

/** Filtros da matriz de Apuração (Visão 1). `isChanged` = setor com alteração no draft. */
export function matchesIndicatorFilters(row: SectorIndicatorRow, filters: SectorIndicatorFilters, isChanged: boolean): boolean {
  if (!matchesSearch(row, filters.search)) return false;
  if (filters.empresaId !== 'todos' && row.empresaId !== filters.empresaId) return false;
  if (filters.setorId !== 'todos' && row.setorId !== filters.setorId) return false;
  if (filters.situacao !== 'todos' && row.situacao !== filters.situacao) return false;
  if (filters.somentePendentes && row.situacao !== 'pendente') return false;
  if (filters.somenteAlterados && !isChanged) return false;
  if (filters.semMedicao && !row.semMedicao) return false;
  return true;
}

/** Filtros do Histórico (Visão 2). Competência comparada como string 'YYYY-MM'. */
export function matchesHistoryFilters(row: SectorIndicatorHistoryRow, filters: SectorIndicatorHistoryFilters): boolean {
  if (!matchesSearch(row, filters.search)) return false;
  if (filters.empresaId !== 'todos' && row.empresaId !== filters.empresaId) return false;
  if (filters.setorId !== 'todos' && row.setorId !== filters.setorId) return false;
  if (filters.situacao !== 'todos' && row.situacao !== filters.situacao) return false;
  if (filters.competenciaInicial && row.competencia < filters.competenciaInicial) return false;
  if (filters.competenciaFinal && row.competencia > filters.competenciaFinal) return false;
  // Filtro por indicador: mantém linhas cujo indicador escolhido tem percentual calculável.
  if (filters.indicatorId !== 'todos' && row.cells[filters.indicatorId]?.percentual == null) return false;
  return true;
}

/** Competências únicas presentes nos registros, mais recentes primeiro. */
export function competenciasFromRegistros(datas: (string | null | undefined)[]): string[] {
  const set = new Set<string>();
  for (const d of datas) {
    const c = dateToCompetencia(d);
    if (c) set.add(c);
  }
  return [...set].sort((a, b) => (a < b ? 1 : -1));
}

export function countActiveFilters(filters: SectorIndicatorFilters): number {
  return [
    filters.empresaId !== 'todos',
    filters.setorId !== 'todos',
    filters.situacao !== 'todos',
    filters.somentePendentes,
    filters.somenteAlterados,
    filters.semMedicao,
  ].filter(Boolean).length;
}
