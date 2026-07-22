import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_TIER_FILTERS, type BonusTierFilters, type BonusTierRow, type BonusTierTab } from '../types/bonus-tier.types';
import { matchesTierFilters, matchesTierTab, countActiveTierFilters, tierTabCounts } from '../domain/bonusTierFilters';

/** Busca (debounced) + filtros + aba + paginação. */
export function useBonusTierFilters(rows: BonusTierRow[]) {
  const [filters, setFiltersState] = useState<BonusTierFilters>(DEFAULT_TIER_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [tab, setTabState] = useState<BonusTierTab>('todas');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setFiltersState(prev => ({ ...prev, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<BonusTierFilters>) => { setFiltersState(prev => ({ ...prev, ...f })); setPage(1); };
  const setTab = (t: BonusTierTab) => { setTabState(t); setPage(1); };
  const resetFilters = () => { setFiltersState(DEFAULT_TIER_FILTERS); setSearchInput(''); setPage(1); };

  const counts = useMemo(() => tierTabCounts(rows), [rows]);
  const byTab = useMemo(() => rows.filter(r => matchesTierTab(r, tab)), [rows, tab]);
  const filtered = useMemo(() => byTab.filter(r => matchesTierFilters(r, filters)), [byTab, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const paged = useMemo(() => filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize), [filtered, clampedPage, pageSize]);

  return {
    filters, setFilters, resetFilters, searchInput, setSearchInput, tab, setTab, counts,
    filtered, paged, page: clampedPage, setPage, pageSize, setPageSize: (n: number) => { setPageSize(n); setPage(1); }, totalPages,
    activeCount: countActiveTierFilters(filters),
  };
}
