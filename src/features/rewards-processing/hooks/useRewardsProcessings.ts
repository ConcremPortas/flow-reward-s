import { useEffect, useMemo, useState } from 'react';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { BasePremiacao } from '@/hooks/useBasePremiacao';
import { buildProcessingRows } from '../domain/rewardsProcessingScope';
import type { ProcessingRow } from '../types/rewards-processing.types';

export interface ProcessingsFilters {
  search: string;
  competencia: string;
  baseId: string;
  categoria: string;
  processadoInicio: string;
  processadoFim: string;
  somenteInconsistencias: boolean;
}

const DEFAULT: ProcessingsFilters = {
  search: '', competencia: '', baseId: 'todos', categoria: 'todos',
  processadoInicio: '', processadoFim: '', somenteInconsistencias: false,
};

function matches(row: ProcessingRow, f: ProcessingsFilters): boolean {
  if (f.search) {
    const t = f.search.toLowerCase();
    if (!row.baseNome.toLowerCase().includes(t) && !row.categorias.some(c => c.toLowerCase().includes(t))) return false;
  }
  if (f.competencia && row.competencia !== f.competencia) return false;
  if (f.baseId !== 'todos' && row.baseId !== f.baseId) return false;
  if (f.categoria !== 'todos' && !row.categorias.includes(f.categoria)) return false;
  if (f.somenteInconsistencias && row.integridade !== 'incompleto') return false;
  if (f.processadoInicio && (row.processadoEm ?? '') < f.processadoInicio) return false;
  if (f.processadoFim && (row.processadoEm ?? '') > `${f.processadoFim}T23:59:59`) return false;
  return true;
}

/** Linhas do histórico de processamentos + filtros + paginação. */
export function useRewardsProcessings(resultados: ResultadoPremiacao[], bases: BasePremiacao[]) {
  const rows = useMemo(() => buildProcessingRows(resultados, bases), [resultados, bases]);
  const [filters, setFiltersState] = useState<ProcessingsFilters>(DEFAULT);
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    const t = setTimeout(() => setFiltersState(prev => ({ ...prev, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<ProcessingsFilters>) => { setFiltersState(prev => ({ ...prev, ...f })); setPage(1); };
  const resetFilters = () => { setFiltersState(DEFAULT); setSearchInput(''); setPage(1); };

  const filtered = useMemo(() => rows.filter(r => matches(r, filters)), [rows, filters]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const paged = useMemo(() => filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize), [filtered, clampedPage, pageSize]);

  return {
    rows, filtered, paged, filters, setFilters, resetFilters, searchInput, setSearchInput,
    page: clampedPage, setPage, pageSize, setPageSize: (n: number) => { setPageSize(n); setPage(1); }, totalPages,
  };
}
