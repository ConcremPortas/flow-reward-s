import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_COMPANY_FILTERS, type CompanyFilters, type CompanyRow } from '../types/company.types';
import { matchesCompanyFilters, countActiveCompanyFilters } from '../domain/companyFilters';

/** Busca (debounced) + filtro de situação. Poucos registros: sem paginação. */
export function useCompanyFilters(rows: CompanyRow[]) {
  const [filters, setFiltersState] = useState<CompanyFilters>(DEFAULT_COMPANY_FILTERS);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setFiltersState(prev => ({ ...prev, search: searchInput })), 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<CompanyFilters>) => setFiltersState(prev => ({ ...prev, ...f }));
  const resetFilters = () => { setFiltersState(DEFAULT_COMPANY_FILTERS); setSearchInput(''); };

  const filtered = useMemo(() => rows.filter(r => matchesCompanyFilters(r, filters)), [rows, filters]);

  return { filters, setFilters, resetFilters, searchInput, setSearchInput, filtered, activeCount: countActiveCompanyFilters(filters) };
}
