import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_FUNCTION_FILTERS, type FunctionFilters, type FunctionRow, type FunctionTab } from '../types/function.types';
import { matchesFunctionFilters, matchesFunctionTab, countActiveFunctionFilters, functionTabCounts } from '../domain/functionFilters';

/** Busca (debounced) + filtros + aba + paginação. */
export function useFunctionFilters(rows: FunctionRow[]) {
  const [filters, setFiltersState] = useState<FunctionFilters>(DEFAULT_FUNCTION_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [tab, setTabState] = useState<FunctionTab>('todas');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setFiltersState(prev => ({ ...prev, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<FunctionFilters>) => { setFiltersState(prev => ({ ...prev, ...f })); setPage(1); };
  const setTab = (t: FunctionTab) => { setTabState(t); setPage(1); };
  const resetFilters = () => { setFiltersState(DEFAULT_FUNCTION_FILTERS); setSearchInput(''); setPage(1); };

  const counts = useMemo(() => functionTabCounts(rows), [rows]);
  const byTab = useMemo(() => rows.filter(r => matchesFunctionTab(r, tab)), [rows, tab]);
  const filtered = useMemo(() => byTab.filter(r => matchesFunctionFilters(r, filters)), [byTab, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const paged = useMemo(() => filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize), [filtered, clampedPage, pageSize]);

  return {
    filters, setFilters, resetFilters, searchInput, setSearchInput, tab, setTab, counts,
    filtered, paged, page: clampedPage, setPage, pageSize, setPageSize: (n: number) => { setPageSize(n); setPage(1); }, totalPages,
    activeCount: countActiveFunctionFilters(filters),
  };
}
