import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_JOB_FILTERS, type JobFilters } from '../types/job.types';
import { contarFiltrosAtivos } from '../domain/jobFilters';

const PICK = <T extends string>(raw: string | null, valid: readonly T[], fallback: T): T =>
  raw && (valid as readonly string[]).includes(raw) ? (raw as T) : fallback;

/** Filtros da lista persistidos na URL (compartilháveis, sobrevivem a refresh e voltar/avançar). */
export function useJobFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filtros = useMemo<JobFilters>(() => ({
    busca: searchParams.get('busca') || '',
    setorId: searchParams.get('setor') || null,
    nivel: searchParams.get('nivel') || null,
    status: PICK(searchParams.get('status'), ['ativos', 'inativos', 'todos'] as const, 'ativos'),
    ocupacao: PICK(searchParams.get('ocupacao'), ['todas', 'ocupados', 'sem_ocupantes'] as const, 'todas'),
    situacao: PICK(searchParams.get('situacao'), ['todas', 'regular', 'incompleta'] as const, 'todas'),
    faixa: PICK(searchParams.get('faixa'), ['todas', 'com_faixa', 'sem_faixa'] as const, 'todas'),
  }), [searchParams]);

  const setFiltros = useCallback((mudanca: Partial<JobFilters>) => {
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      const next = { ...filtros, ...mudanca };
      const put = (k: string, v: string | null, def = '') => { if (v && v !== def) sp.set(k, v); else sp.delete(k); };
      put('busca', next.busca);
      put('setor', next.setorId);
      put('nivel', next.nivel);
      put('status', next.status, 'ativos');
      put('ocupacao', next.ocupacao, 'todas');
      put('situacao', next.situacao, 'todas');
      put('faixa', next.faixa, 'todas');
      return sp;
    }, { replace: true });
  }, [filtros, setSearchParams]);

  const limpar = useCallback(() => {
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      ['busca', 'setor', 'nivel', 'status', 'ocupacao', 'situacao', 'faixa'].forEach((k) => sp.delete(k));
      return sp;
    }, { replace: true });
  }, [setSearchParams]);

  return { filtros, setFiltros, limpar, ativos: contarFiltrosAtivos(filtros) };
}
