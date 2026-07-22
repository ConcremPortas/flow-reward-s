import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_JOB_EMPLOYEE_FILTERS, type JobEmployeeFilters, type SortKey, type SortState } from '../types/job-employee.types';
import { contarFiltrosAtivos } from '../domain/employeeFilters';
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '../views';

const PICK = <T extends string>(raw: string | null, valid: readonly T[], fallback: T): T =>
  raw && (valid as readonly string[]).includes(raw) ? (raw as T) : fallback;

/**
 * Filtros + ordenação + paginação persistidos na URL (compartilháveis, sobrevivem
 * a refresh e voltar/avançar). A busca é debounced (300ms) para não filtrar a
 * cada tecla. Não altera o `?view=` (gerido pelo shell).
 */
export function useJobEmployeeFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const buscaUrl = searchParams.get('busca') || '';
  const [buscaInput, setBuscaInput] = useState(buscaUrl);
  const primeiraRender = useRef(true);

  // Debounce da busca -> URL.
  useEffect(() => {
    if (primeiraRender.current) { primeiraRender.current = false; return; }
    const t = setTimeout(() => {
      setSearchParams((prev) => {
        const sp = new URLSearchParams(prev);
        if (buscaInput.trim() !== '') sp.set('busca', buscaInput); else sp.delete('busca');
        sp.delete('pagina');
        return sp;
      }, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  }, [buscaInput, setSearchParams]);

  const filtros = useMemo<JobEmployeeFilters>(() => ({
    busca: buscaUrl,
    empresaId: searchParams.get('empresa') || null,
    setorId: searchParams.get('setor') || null,
    funcaoId: searchParams.get('funcao') || null,
    cargoId: searchParams.get('cargo') || null,
    status: PICK(searchParams.get('status'), ['ativos', 'inativos', 'todos'] as const, 'ativos'),
    enquadramento: PICK(searchParams.get('enq'), ['todos', 'enquadrados', 'sem_cargo', 'pendentes'] as const, 'todos'),
    faixa: PICK(searchParams.get('faixa'), ['todas', 'dentro', 'abaixo', 'acima', 'sem_salario'] as const, 'todas'),
  }), [searchParams, buscaUrl]);

  const sort = useMemo<SortState>(() => ({
    key: PICK(searchParams.get('sort'), ['nome', 'funcao', 'cargo', 'setor', 'enquadramento'] as const, 'nome'),
    dir: PICK(searchParams.get('dir'), ['asc', 'desc'] as const, 'asc'),
  }), [searchParams]);

  const pagina = Math.max(1, Number(searchParams.get('pagina')) || 1);
  const porPagina = PAGE_SIZES.includes(Number(searchParams.get('tam')) as typeof PAGE_SIZES[number])
    ? Number(searchParams.get('tam')) : DEFAULT_PAGE_SIZE;

  const setFiltros = useCallback((mudanca: Partial<JobEmployeeFilters>) => {
    if ('busca' in mudanca) setBuscaInput(mudanca.busca ?? '');
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      const next = { ...filtros, ...mudanca };
      const put = (k: string, v: string | null, def = '') => { if (v && v !== def) sp.set(k, v); else sp.delete(k); };
      put('empresa', next.empresaId);
      put('setor', next.setorId);
      put('funcao', next.funcaoId);
      put('cargo', next.cargoId);
      put('status', next.status, 'ativos');
      put('enq', next.enquadramento, 'todos');
      put('faixa', next.faixa, 'todas');
      if ('busca' in mudanca) put('busca', next.busca);
      sp.delete('pagina'); // qualquer mudança de filtro volta à página 1
      return sp;
    }, { replace: true });
  }, [filtros, setSearchParams]);

  const setSort = useCallback((key: SortKey) => {
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      const dirAtual = sp.get('sort') === key && sp.get('dir') !== 'desc' ? 'desc' : 'asc';
      sp.set('sort', key); sp.set('dir', dirAtual);
      return sp;
    }, { replace: true });
  }, [setSearchParams]);

  const setPagina = useCallback((p: number) => {
    setSearchParams((prev) => { const sp = new URLSearchParams(prev); if (p <= 1) sp.delete('pagina'); else sp.set('pagina', String(p)); return sp; }, { replace: true });
  }, [setSearchParams]);

  const setPorPagina = useCallback((n: number) => {
    setSearchParams((prev) => { const sp = new URLSearchParams(prev); if (n === DEFAULT_PAGE_SIZE) sp.delete('tam'); else sp.set('tam', String(n)); sp.delete('pagina'); return sp; }, { replace: true });
  }, [setSearchParams]);

  const limpar = useCallback(() => {
    setBuscaInput('');
    setSearchParams((prev) => {
      const sp = new URLSearchParams(prev);
      ['busca', 'empresa', 'setor', 'funcao', 'cargo', 'status', 'enq', 'faixa', 'pagina'].forEach((k) => sp.delete(k));
      return sp;
    }, { replace: true });
  }, [setSearchParams]);

  return {
    filtros, sort, pagina, porPagina, buscaInput,
    setBuscaInput, setFiltros, setSort, setPagina, setPorPagina, limpar,
    ativos: contarFiltrosAtivos(filtros),
  };
}
