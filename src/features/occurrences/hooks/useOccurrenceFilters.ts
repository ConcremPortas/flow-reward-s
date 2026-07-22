import { useEffect, useMemo, useState } from 'react';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { DEFAULT_OCCURRENCE_FILTERS, type OccurrenceDraftMap, type OccurrenceFilters } from '../types';
import { matchesOccurrenceFilters } from '../domain/occurrenceFilters';

interface Args {
  funcionarios: Funcionario[];
  baseline: OccurrenceDraftMap;
  draft: OccurrenceDraftMap;
}

/** Busca (debounced) + filtros + paginação da grade de lançamento. */
export function useOccurrenceFilters({ funcionarios, baseline, draft }: Args) {
  const [filters, setFiltersState] = useState<OccurrenceFilters>(DEFAULT_OCCURRENCE_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setFiltersState((prev) => ({ ...prev, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<OccurrenceFilters>) => { setFiltersState((prev) => ({ ...prev, ...f })); setPage(1); };
  const resetFilters = () => { setFiltersState(DEFAULT_OCCURRENCE_FILTERS); setSearchInput(''); setPage(1); };

  const ctx = useMemo(() => ({ baseline, draft }), [baseline, draft]);
  const filtered = useMemo(
    () => funcionarios.filter((f) => matchesOccurrenceFilters(f, filters, ctx)),
    [funcionarios, filters, ctx],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize),
    [filtered, clampedPage, pageSize],
  );

  const activeFilterCount = [
    filters.setorId !== 'todos',
    filters.categoriaId !== 'todos',
    filters.tipo !== 'todos',
    filters.somenteComOcorrencia,
    filters.somenteAlterados,
    filters.ocultarZerados,
  ].filter(Boolean).length;

  return {
    filters, setFilters, resetFilters,
    searchInput, setSearchInput,
    filtered, paged,
    page: clampedPage, setPage, pageSize, setPageSize: (n: number) => { setPageSize(n); setPage(1); }, totalPages,
    activeFilterCount,
  };
}
