import { useEffect, useMemo, useState } from 'react';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import {
  DEFAULT_REPORT_FILTERS, matchesReportFilters, countActiveReportFilters,
  distinctSetores, distinctFaixas, type ReportFilters,
} from '../domain/rewardsReportFilters';

export interface InitialReportFilters {
  competencia?: string;
  baseId?: string;
  categoria?: string;
}

/**
 * Estado dos filtros do relatório (globais + avançados). Semeado por query
 * string (competência/base/categoria) vinda de Gerar Premiações. Retorna o
 * dataset FILTRADO completo (não paginado) — as exportações usam este conjunto.
 */
export function useRewardsReportFilters(resultados: ResultadoPremiacao[], initial: InitialReportFilters) {
  const [filters, setFiltersState] = useState<ReportFilters>({
    ...DEFAULT_REPORT_FILTERS,
    competencia: initial.competencia ?? '',
    baseId: initial.baseId ?? 'todos',
    categoria: initial.categoria ?? 'todos',
  });
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setFiltersState(prev => ({ ...prev, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const setFilters = (f: Partial<ReportFilters>) => setFiltersState(prev => ({ ...prev, ...f }));
  const setCriterio = (key: keyof ReportFilters['criterios'], value: boolean) =>
    setFiltersState(prev => ({ ...prev, criterios: { ...prev.criterios, [key]: value } }));
  const reset = () => { setFiltersState({ ...DEFAULT_REPORT_FILTERS, competencia: filters.competencia }); setSearchInput(''); };

  const filteredAll = useMemo(() => resultados.filter(r => matchesReportFilters(r, filters)), [resultados, filters]);
  const setores = useMemo(() => distinctSetores(resultados), [resultados]);
  const faixas = useMemo(() => distinctFaixas(resultados), [resultados]);

  return {
    filters, setFilters, setCriterio, reset, searchInput, setSearchInput,
    filteredAll, setores, faixas, activeCount: countActiveReportFilters(filters),
  };
}

export type UseRewardsReportFiltersReturn = ReturnType<typeof useRewardsReportFilters>;
