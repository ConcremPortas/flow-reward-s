import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DEFAULT_FILTERS, type JobsSalariesFilters } from '../types/jobsSalaries.types';
import { contarFiltrosAtivos } from '../domain/filters';

const STATUS_VALIDOS = new Set(['ativos', 'inativos', 'todos']);

/**
 * Filtros globais persistidos na URL (compartilháveis). O parâmetro `?view=` é
 * gerido pelo shell; aqui cuidamos apenas de setor/nível/cargo/status/busca.
 */
export function useJobsSalariesFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const filtros = useMemo<JobsSalariesFilters>(() => {
    const statusRaw = searchParams.get('status');
    return {
      setorId: searchParams.get('setor') || null,
      nivel: searchParams.get('nivel') || null,
      cargoId: searchParams.get('cargo') || null,
      status: (statusRaw && STATUS_VALIDOS.has(statusRaw) ? statusRaw : 'ativos') as JobsSalariesFilters['status'],
      busca: searchParams.get('busca') || '',
    };
  }, [searchParams]);

  const patch = useCallback(
    (mudanca: Partial<JobsSalariesFilters>) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          const proximo = { ...filtros, ...mudanca };
          const setOrDelete = (key: string, val: string | null) => {
            if (val && val.trim() !== '') sp.set(key, val);
            else sp.delete(key);
          };
          setOrDelete('setor', proximo.setorId);
          setOrDelete('nivel', proximo.nivel);
          setOrDelete('cargo', proximo.cargoId);
          setOrDelete('busca', proximo.busca);
          if (proximo.status === 'ativos') sp.delete('status');
          else sp.set('status', proximo.status);
          return sp;
        },
        { replace: true },
      );
    },
    [filtros, setSearchParams],
  );

  const limpar = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        ['setor', 'nivel', 'cargo', 'busca', 'status'].forEach((k) => sp.delete(k));
        return sp;
      },
      { replace: true },
    );
  }, [setSearchParams]);

  return {
    filtros,
    setFiltros: patch,
    limpar,
    ativos: contarFiltrosAtivos(filtros),
    padrao: DEFAULT_FILTERS,
  };
}
