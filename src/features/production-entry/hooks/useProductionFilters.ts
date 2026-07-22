import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DEFAULT_PRODUCTION_FILTERS, DEFAULT_HISTORY_FILTERS,
  type ProductionFilters, type ProductionHistoryFilters, type ProductionRow, type ProductionHistoryRow,
} from '../types/production-entry.types';
import { matchesProductionFilters, matchesHistoryFilters } from '../domain/productionFilters';

/** Busca/filtros/paginação da grade de Apuração (Visão 1). */
export function useProductionFilters(rows: ProductionRow[], changedSetorIds: Set<string>) {
  const [searchParams] = useSearchParams();
  // Integração vinda de Setores: ?setor= pré-aplica o filtro de setor.
  const [filters, setFiltersState] = useState<ProductionFilters>(() => ({
    ...DEFAULT_PRODUCTION_FILTERS,
    setorId: searchParams.get('setor') ?? DEFAULT_PRODUCTION_FILTERS.setorId,
  }));
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setFiltersState((prev) => ({ ...prev, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<ProductionFilters>) => { setFiltersState((prev) => ({ ...prev, ...f })); setPage(1); };
  const resetFilters = () => { setFiltersState(DEFAULT_PRODUCTION_FILTERS); setSearchInput(''); setPage(1); };

  const filtered = useMemo(
    () => rows.filter((r) => matchesProductionFilters(r, filters, changedSetorIds.has(r.setorId))),
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
export function useProductionHistoryFilters(rows: ProductionHistoryRow[]) {
  const [filters, setFiltersState] = useState<ProductionHistoryFilters>(DEFAULT_HISTORY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setFiltersState((prev) => ({ ...prev, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<ProductionHistoryFilters>) => { setFiltersState((prev) => ({ ...prev, ...f })); setPage(1); };
  const resetFilters = () => { setFiltersState(DEFAULT_HISTORY_FILTERS); setSearchInput(''); setPage(1); };

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
