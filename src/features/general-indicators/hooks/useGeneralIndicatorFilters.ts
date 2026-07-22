import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_GENERAL_FILTERS, type GeneralHistoryRow, type GeneralIndicatorFilters,
} from '../types/general-indicators.types';
import { hasAnomaly } from '../domain/indicatorDataQuality';

function matches(row: GeneralHistoryRow, f: GeneralIndicatorFilters): boolean {
  if (f.search) {
    const t = f.search.toLowerCase();
    if (!row.nome.toLowerCase().includes(t) && !row.codigo.toLowerCase().includes(t)) return false;
  }
  if (f.tipoId !== 'todos' && row.tipoId !== f.tipoId) return false;
  if (f.situacao !== 'todos' && row.situacao !== f.situacao) return false;
  if (f.competenciaInicial && row.competencia < f.competenciaInicial) return false;
  if (f.competenciaFinal && row.competencia > f.competenciaFinal) return false;
  if (f.somenteInconsistencias && !hasAnomaly(row.quality)) return false;
  return true;
}

export function countActiveGeneralFilters(f: GeneralIndicatorFilters): number {
  return [
    f.tipoId !== 'todos',
    f.situacao !== 'todos',
    !!f.competenciaInicial,
    !!f.competenciaFinal,
    f.somenteInconsistencias,
  ].filter(Boolean).length;
}

/** Busca/filtros/paginação do Histórico. */
export function useGeneralIndicatorFilters(rows: GeneralHistoryRow[]) {
  const [filters, setFiltersState] = useState<GeneralIndicatorFilters>(DEFAULT_GENERAL_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setFiltersState((prev) => ({ ...prev, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<GeneralIndicatorFilters>) => { setFiltersState((prev) => ({ ...prev, ...f })); setPage(1); };
  const resetFilters = () => { setFiltersState(DEFAULT_GENERAL_FILTERS); setSearchInput(''); setPage(1); };

  const filtered = useMemo(() => rows.filter((r) => matches(r, filters)), [rows, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const paged = useMemo(() => filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize), [filtered, clampedPage, pageSize]);

  return {
    filters, setFilters, resetFilters, searchInput, setSearchInput,
    filtered, paged, page: clampedPage, setPage, pageSize,
    setPageSize: (n: number) => { setPageSize(n); setPage(1); }, totalPages,
    activeCount: countActiveGeneralFilters(filters),
  };
}
