import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DEFAULT_INDICATOR_FILTERS, DEFAULT_INDICATOR_HISTORY_FILTERS,
  type SectorIndicatorFilters, type SectorIndicatorHistoryFilters,
  type SectorIndicatorHistoryRow, type SectorIndicatorRow,
} from '../types/sector-indicators.types';
import { matchesIndicatorFilters, matchesHistoryFilters } from '../domain/indicatorFilters';

/** Busca/filtros/paginação da matriz de Apuração (Visão 1). */
export function useSectorIndicatorsFilters(rows: SectorIndicatorRow[], changedSetorIds: Set<string>) {
  const [searchParams] = useSearchParams();
  // Integração vinda de Setores: ?setor= pré-aplica o filtro de setor.
  const [filters, setFiltersState] = useState<SectorIndicatorFilters>(() => ({
    ...DEFAULT_INDICATOR_FILTERS,
    setorId: searchParams.get('setor') ?? DEFAULT_INDICATOR_FILTERS.setorId,
  }));
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setFiltersState((prev) => ({ ...prev, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<SectorIndicatorFilters>) => { setFiltersState((prev) => ({ ...prev, ...f })); setPage(1); };
  const resetFilters = () => { setFiltersState(DEFAULT_INDICATOR_FILTERS); setSearchInput(''); setPage(1); };

  const filtered = useMemo(
    () => rows.filter((r) => matchesIndicatorFilters(r, filters, changedSetorIds.has(r.setorId))),
    [rows, filters, changedSetorIds],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize),
    [filtered, clampedPage, pageSize],
  );

  return {
    filters, setFilters, resetFilters, searchInput, setSearchInput,
    filtered, paged, page: clampedPage, setPage, pageSize,
    setPageSize: (n: number) => { setPageSize(n); setPage(1); }, totalPages,
  };
}

/** Busca/filtros/paginação do Histórico (Visão 2). */
export function useSectorIndicatorsHistoryFilters(rows: SectorIndicatorHistoryRow[]) {
  const [filters, setFiltersState] = useState<SectorIndicatorHistoryFilters>(DEFAULT_INDICATOR_HISTORY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setFiltersState((prev) => ({ ...prev, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<SectorIndicatorHistoryFilters>) => { setFiltersState((prev) => ({ ...prev, ...f })); setPage(1); };
  const resetFilters = () => { setFiltersState(DEFAULT_INDICATOR_HISTORY_FILTERS); setSearchInput(''); setPage(1); };

  const filtered = useMemo(() => rows.filter((r) => matchesHistoryFilters(r, filters)), [rows, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize),
    [filtered, clampedPage, pageSize],
  );

  return {
    filters, setFilters, resetFilters, searchInput, setSearchInput,
    filtered, paged, page: clampedPage, setPage, pageSize,
    setPageSize: (n: number) => { setPageSize(n); setPage(1); }, totalPages,
  };
}
