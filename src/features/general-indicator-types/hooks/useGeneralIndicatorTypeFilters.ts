import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_GENERAL_INDICATOR_TYPE_FILTERS, type GeneralIndicatorTypeFilters, type GeneralIndicatorTypeRow } from '../types/general-indicator-type.types';
import { matchesGeneralIndicatorTypeFilters, countActiveGeneralIndicatorTypeFilters } from '../domain/generalIndicatorTypeFilters';

/** Busca (debounced) + filtros. Poucos registros: sem paginação. */
export function useGeneralIndicatorTypeFilters(rows: GeneralIndicatorTypeRow[]) {
  const [filters, setFiltersState] = useState<GeneralIndicatorTypeFilters>(DEFAULT_GENERAL_INDICATOR_TYPE_FILTERS);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setFiltersState(prev => ({ ...prev, search: searchInput })), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<GeneralIndicatorTypeFilters>) => setFiltersState(prev => ({ ...prev, ...f }));
  const resetFilters = () => { setFiltersState(DEFAULT_GENERAL_INDICATOR_TYPE_FILTERS); setSearchInput(''); };

  const filtered = useMemo(() => rows.filter(r => matchesGeneralIndicatorTypeFilters(r, filters)), [rows, filters]);

  return { filters, setFilters, resetFilters, searchInput, setSearchInput, filtered, activeCount: countActiveGeneralIndicatorTypeFilters(filters) };
}
