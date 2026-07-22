import { useEffect, useMemo, useState } from 'react';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { DEFAULT_FILTERS, type EmployeeFilters, type EmployeeTab } from '../types';
import { matchesFilters, matchesTab, tabCounts } from '../domain/employeeFilters';

/** Busca (debounced) + filtros + aba ativa. Preserva os filtros durante a sessão. */
export function useEmployeeFilters(funcionarios: Funcionario[]) {
  const [filters, setFiltersState] = useState<EmployeeFilters>(DEFAULT_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [tab, setTab] = useState<EmployeeTab>('todos');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Debounce da busca (300ms)
  useEffect(() => {
    const t = setTimeout(() => setFiltersState((prev) => ({ ...prev, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<EmployeeFilters>) => { setFiltersState((prev) => ({ ...prev, ...f })); setPage(1); };
  const setTabAndReset = (t: EmployeeTab) => { setTab(t); setPage(1); };
  const resetFilters = () => { setFiltersState(DEFAULT_FILTERS); setSearchInput(''); setPage(1); };

  const byTab = useMemo(() => funcionarios.filter((f) => matchesTab(f, tab)), [funcionarios, tab]);
  const filtered = useMemo(() => byTab.filter((f) => matchesFilters(f, filters)), [byTab, filters]);
  const counts = useMemo(() => tabCounts(funcionarios), [funcionarios]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize),
    [filtered, clampedPage, pageSize],
  );

  const activeFilterCount = [
    filters.empresaId !== 'todos',
    filters.setorId !== 'todos',
    filters.funcaoId !== 'todos',
    filters.categoriaId !== 'todos',
    filters.localDssId !== 'todos',
    filters.status !== 'todos',
    filters.eligibility !== 'todos',
  ].filter(Boolean).length;

  return {
    filters, setFilters, resetFilters,
    searchInput, setSearchInput,
    tab, setTab: setTabAndReset, counts,
    filtered, paged,
    page: clampedPage, setPage, pageSize, setPageSize: (n: number) => { setPageSize(n); setPage(1); }, totalPages,
    activeFilterCount,
  };
}
