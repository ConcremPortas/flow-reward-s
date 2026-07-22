import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_USER_FILTERS, type UserFilters, type UserRow } from '../types/user.types';
import { matchesUserFilters, countActiveUserFilters } from '../domain/userFilters';

/** Busca (debounced) + filtros. */
export function useUserFilters(rows: UserRow[]) {
  const [filters, setFiltersState] = useState<UserFilters>(DEFAULT_USER_FILTERS);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setFiltersState(prev => ({ ...prev, search: searchInput })), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<UserFilters>) => setFiltersState(prev => ({ ...prev, ...f }));
  const resetFilters = () => { setFiltersState(DEFAULT_USER_FILTERS); setSearchInput(''); };

  const filtered = useMemo(() => rows.filter(r => matchesUserFilters(r, filters)), [rows, filters]);

  return { filters, setFilters, resetFilters, searchInput, setSearchInput, filtered, activeCount: countActiveUserFilters(filters) };
}
