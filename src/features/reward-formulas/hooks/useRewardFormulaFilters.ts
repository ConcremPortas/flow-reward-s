import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_REWARD_FORMULA_FILTERS, type RewardFormulaFilters, type RewardFormulaRow } from '../types/reward-formula.types';
import { matchesFormulaFilters, countActiveFormulaFilters } from '../domain/rewardFormulaFilters';

/** Busca (debounced) + filtros. */
export function useRewardFormulaFilters(rows: RewardFormulaRow[]) {
  const [filters, setFiltersState] = useState<RewardFormulaFilters>(DEFAULT_REWARD_FORMULA_FILTERS);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setFiltersState(prev => ({ ...prev, search: searchInput })), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<RewardFormulaFilters>) => setFiltersState(prev => ({ ...prev, ...f }));
  const resetFilters = () => { setFiltersState(DEFAULT_REWARD_FORMULA_FILTERS); setSearchInput(''); };

  const filtered = useMemo(() => rows.filter(r => matchesFormulaFilters(r, filters)), [rows, filters]);

  return { filters, setFilters, resetFilters, searchInput, setSearchInput, filtered, activeCount: countActiveFormulaFilters(filters) };
}
