import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_DSS_LOCATION_FILTERS, type DssLocationFilters, type DssLocationRow } from '../types/dss-location.types';
import { matchesDssLocationFilters, countActiveDssLocationFilters } from '../domain/dssLocationFilters';

/** Busca (debounced) + filtros. Poucos registros: sem paginação. */
export function useDssLocationFilters(rows: DssLocationRow[]) {
  const [filters, setFiltersState] = useState<DssLocationFilters>(DEFAULT_DSS_LOCATION_FILTERS);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setFiltersState(prev => ({ ...prev, search: searchInput })), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<DssLocationFilters>) => setFiltersState(prev => ({ ...prev, ...f }));
  const resetFilters = () => { setFiltersState(DEFAULT_DSS_LOCATION_FILTERS); setSearchInput(''); };

  const filtered = useMemo(() => rows.filter(r => matchesDssLocationFilters(r, filters)), [rows, filters]);

  return { filters, setFilters, resetFilters, searchInput, setSearchInput, filtered, activeCount: countActiveDssLocationFilters(filters) };
}
