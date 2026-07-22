import { useEffect, useMemo, useState } from 'react';
import type { Funcionario } from '@/hooks/useFuncionarios';
import {
  DEFAULT_COMPLIANCE_FILTERS, DEFAULT_EPI_HISTORY_FILTERS, DEFAULT_NON_CONFORMITY_FILTERS,
  type ComplianceFilters, type ComplianceMap, type EpiHistoryFilters, type EpiNonConformityFilters, type EpiNonConformityRow,
} from '../types/epi.types';
import { matchesComplianceFilters, matchesEpiHistoryRow, matchesNonConformityRow } from '../domain/epiFilters';
import type { EpiAuditGroupEnriched } from '../domain/epiCalculations';

/** Busca/filtros/paginação da Inspeção (Etapa 2). */
export function useComplianceFilters(funcionarios: Funcionario[], draft: ComplianceMap, baseline: ComplianceMap) {
  const [filters, setFiltersState] = useState<ComplianceFilters>(DEFAULT_COMPLIANCE_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setFiltersState((prev) => ({ ...prev, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<ComplianceFilters>) => { setFiltersState((prev) => ({ ...prev, ...f })); setPage(1); };
  const resetFilters = () => { setFiltersState(DEFAULT_COMPLIANCE_FILTERS); setSearchInput(''); setPage(1); };

  const filtered = useMemo(
    () => funcionarios.filter((f) => matchesComplianceFilters(f, filters, draft, baseline)),
    [funcionarios, filters, draft, baseline],
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

/** Busca/filtros/paginação do Histórico (Visão 3). */
export function useEpiHistoryFilters(groups: EpiAuditGroupEnriched[]) {
  const [filters, setFiltersState] = useState<EpiHistoryFilters>(DEFAULT_EPI_HISTORY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const t = setTimeout(() => setFiltersState((prev) => ({ ...prev, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<EpiHistoryFilters>) => { setFiltersState((prev) => ({ ...prev, ...f })); setPage(1); };
  const resetFilters = () => { setFiltersState(DEFAULT_EPI_HISTORY_FILTERS); setSearchInput(''); setPage(1); };

  const filtered = useMemo(() => groups.filter((g) => matchesEpiHistoryRow(g, filters)), [groups, filters]);

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

/** Busca/filtros/paginação da Visão "Não Conformidades" (Visão 2). */
export function useNonConformityFilters(rows: EpiNonConformityRow[]) {
  const [filters, setFiltersState] = useState<EpiNonConformityFilters>(DEFAULT_NON_CONFORMITY_FILTERS);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setFiltersState((prev) => ({ ...prev, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<EpiNonConformityFilters>) => { setFiltersState((prev) => ({ ...prev, ...f })); setPage(1); };
  const resetFilters = () => { setFiltersState(DEFAULT_NON_CONFORMITY_FILTERS); setSearchInput(''); setPage(1); };

  const filtered = useMemo(() => rows.filter((r) => matchesNonConformityRow(r, filters)), [rows, filters]);

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
