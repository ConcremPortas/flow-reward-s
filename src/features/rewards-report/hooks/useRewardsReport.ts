import { useBasePremiacao } from '@/hooks/useBasePremiacao';
import { useResultadosPremiacao } from '@/hooks/useResultadosPremiacao';
import { useCategorias } from '@/hooks/useCategorias';

/**
 * Fontes do relatório — resultados persistidos + bases + categorias. Reaproveita
 * os hooks existentes; NÃO recalcula premiação (só consome o que foi salvo).
 */
export function useRewardsReport() {
  const { resultados, loading, refetch } = useResultadosPremiacao();
  const { bases, loading: basesLoading } = useBasePremiacao();
  const { categorias } = useCategorias();
  return { resultados, bases, categorias, loading: loading || basesLoading, refetch };
}

export type UseRewardsReportReturn = ReturnType<typeof useRewardsReport>;
