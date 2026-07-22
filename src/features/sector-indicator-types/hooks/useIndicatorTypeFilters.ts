import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_INDICATOR_TYPE_FILTERS, type IndicatorTypeFilters, type IndicatorTypeRow } from '../types/indicator-type.types';
import { matchesIndicatorTypeFilters, countActiveIndicatorTypeFilters } from '../domain/indicatorTypeFilters';

/** Busca (debounced) + filtros. Poucos registros: sem paginação. */
export function useIndicatorTypeFilters(rows: IndicatorTypeRow[]) {
  const [filters, setFiltersState] = useState<IndicatorTypeFilters>(DEFAULT_INDICATOR_TYPE_FILTERS);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setFiltersState(prev => ({ ...prev, search: searchInput })), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<IndicatorTypeFilters>) => setFiltersState(prev => ({ ...prev, ...f }));
  const resetFilters = () => { setFiltersState(DEFAULT_INDICATOR_TYPE_FILTERS); setSearchInput(''); };

  const filtered = useMemo(() => rows.filter(r => matchesIndicatorTypeFilters(r, filters)), [rows, filters]);

  return { filters, setFilters, resetFilters, searchInput, setSearchInput, filtered, activeCount: countActiveIndicatorTypeFilters(filters) };
}
