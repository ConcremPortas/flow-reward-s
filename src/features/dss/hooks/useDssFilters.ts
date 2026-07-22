import { useEffect, useMemo, useState } from 'react';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { DEFAULT_ATTENDANCE_FILTERS, DEFAULT_HISTORY_FILTERS, type AttendanceFilters, type DssHistoryRow, type HistoryFilters, type PresenceMap } from '../types';
import { matchesAttendanceFilters, matchesHistoryRow } from '../domain/dssFilters';

/** Busca/filtros/paginação da lista de presença (Etapa 2). */
export function useAttendanceFilters(vinculados: Funcionario[], draft: PresenceMap) {
  const [filters, setFiltersState] = useState<AttendanceFilters>(DEFAULT_ATTENDANCE_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setFiltersState((prev) => ({ ...prev, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<AttendanceFilters>) => { setFiltersState((prev) => ({ ...prev, ...f })); setPage(1); };
  const resetFilters = () => { setFiltersState(DEFAULT_ATTENDANCE_FILTERS); setSearchInput(''); setPage(1); };

  const filtered = useMemo(
    () => vinculados.filter((f) => matchesAttendanceFilters(f, filters, draft)),
    [vinculados, filters, draft],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize),
    [filtered, clampedPage, pageSize],
  );

  return {
    filters, setFilters, resetFilters, searchInput, setSearchInput,
    filtered, paged, page: clampedPage, setPage, pageSize,
    setPageSize: (n: number) => { setPageSize(n); setPage(1); }, totalPages,
  };
}

/** Busca/filtros/paginação do Histórico (Visão 2). */
export function useDssHistoryFilters(rows: DssHistoryRow[]) {
  const [filters, setFiltersState] = useState<HistoryFilters>(DEFAULT_HISTORY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const t = setTimeout(() => setFiltersState((prev) => ({ ...prev, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<HistoryFilters>) => { setFiltersState((prev) => ({ ...prev, ...f })); setPage(1); };
  const resetFilters = () => { setFiltersState(DEFAULT_HISTORY_FILTERS); setSearchInput(''); setPage(1); };

  const filtered = useMemo(() => rows.filter((r) => matchesHistoryRow(r, filters)), [rows, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const paged = useMemo(
    () => filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize),
    [filtered, clampedPage, pageSize],
  );

  const activeFilterCount = [
    filters.localId !== 'todos', filters.participacao !== 'todos', !!filters.competenciaInicial, !!filters.competenciaFinal,
  ].filter(Boolean).length;

  return {
    filters, setFilters, resetFilters, searchInput, setSearchInput,
    filtered, paged, page: clampedPage, setPage, pageSize,
    setPageSize: (n: number) => { setPageSize(n); setPage(1); }, totalPages, activeFilterCount,
  };
}
