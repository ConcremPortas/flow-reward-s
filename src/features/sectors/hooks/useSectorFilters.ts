import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_SECTOR_FILTERS, type SectorFilters, type SectorRow, type SectorTab,
} from '../types/sector.types';
import { matchesSectorFilters, matchesTab, countActiveSectorFilters, tabCounts } from '../domain/sectorFilters';

/** Busca (debounced) + filtros + aba + paginação da visão de setores. */
export function useSectorFilters(rows: SectorRow[]) {
  const [filters, setFiltersState] = useState<SectorFilters>(DEFAULT_SECTOR_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [tab, setTabState] = useState<SectorTab>('todos');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setFiltersState(prev => ({ ...prev, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<SectorFilters>) => { setFiltersState(prev => ({ ...prev, ...f })); setPage(1); };
  const setTab = (t: SectorTab) => { setTabState(t); setPage(1); };
  const resetFilters = () => { setFiltersState(DEFAULT_SECTOR_FILTERS); setSearchInput(''); setPage(1); };

  const counts = useMemo(() => tabCounts(rows), [rows]);
  const byTab = useMemo(() => rows.filter(r => matchesTab(r, tab)), [rows, tab]);
  const filtered = useMemo(() => byTab.filter(r => matchesSectorFilters(r, filters)), [byTab, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const paged = useMemo(() => filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize), [filtered, clampedPage, pageSize]);

  return {
    filters, setFilters, resetFilters, searchInput, setSearchInput,
    tab, setTab, counts,
    filtered, paged, page: clampedPage, setPage, pageSize, setPageSize: (n: number) => { setPageSize(n); setPage(1); }, totalPages,
    activeCount: countActiveSectorFilters(filters),
  };
}
