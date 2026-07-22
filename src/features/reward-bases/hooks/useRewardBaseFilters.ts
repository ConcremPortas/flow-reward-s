import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_REWARD_BASE_FILTERS, type RewardBaseFilters, type RewardBaseRow, type RewardBaseTab } from '../types/reward-base.types';
import { matchesRewardBaseFilters, matchesRewardBaseTab, countActiveRewardBaseFilters, rewardBaseTabCounts } from '../domain/rewardBaseFilters';

/** Busca (debounced) + filtros + aba. Poucos registros: sem paginação. */
export function useRewardBaseFilters(rows: RewardBaseRow[]) {
  const [filters, setFiltersState] = useState<RewardBaseFilters>(DEFAULT_REWARD_BASE_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [tab, setTabState] = useState<RewardBaseTab>('todas');

  useEffect(() => {
    const t = setTimeout(() => setFiltersState(prev => ({ ...prev, search: searchInput })), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<RewardBaseFilters>) => setFiltersState(prev => ({ ...prev, ...f }));
  const setTab = (t: RewardBaseTab) => setTabState(t);
  const resetFilters = () => { setFiltersState(DEFAULT_REWARD_BASE_FILTERS); setSearchInput(''); };

  const counts = useMemo(() => rewardBaseTabCounts(rows), [rows]);
  const byTab = useMemo(() => rows.filter(r => matchesRewardBaseTab(r, tab)), [rows, tab]);
  const filtered = useMemo(() => byTab.filter(r => matchesRewardBaseFilters(r, filters)), [byTab, filters]);

  return {
    filters, setFilters, resetFilters, searchInput, setSearchInput, tab, setTab, counts,
    filtered, activeCount: countActiveRewardBaseFilters(filters),
  };
}
