import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_CATEGORY_FILTERS, type CategoryFilters, type CategoryRow } from '../types/category.types';
import { matchesCategoryFilters, countActiveCategoryFilters } from '../domain/categoryFilters';

/** Busca (debounced) + filtro de utilização. Poucos registros: sem paginação. */
export function useCategoryFilters(rows: CategoryRow[]) {
  const [filters, setFiltersState] = useState<CategoryFilters>(DEFAULT_CATEGORY_FILTERS);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setFiltersState(prev => ({ ...prev, search: searchInput })), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<CategoryFilters>) => setFiltersState(prev => ({ ...prev, ...f }));
  const resetFilters = () => { setFiltersState(DEFAULT_CATEGORY_FILTERS); setSearchInput(''); };

  const filtered = useMemo(() => rows.filter(r => matchesCategoryFilters(r, filters)), [rows, filters]);

  return {
    filters, setFilters, resetFilters, searchInput, setSearchInput,
    filtered, activeCount: countActiveCategoryFilters(filters),
  };
}
