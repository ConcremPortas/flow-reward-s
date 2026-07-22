import { useMemo } from 'react';
import { useIndicadoresGerais, type IndicadorGeral } from '@/hooks/useIndicadoresGerais';
import { useTiposIndicadoresGerais } from '@/hooks/useTiposIndicadoresGerais';
import { competenciaToDate } from '../domain/indicatorCalculations';

/**
 * Composição das fontes da Central de Indicadores Corporativos. Reaproveita os
 * hooks existentes (create/update/delete inalterados — o `percentual` continua
 * sendo gravado pela regra legada consumida pela premiação).
 */
export function useGeneralIndicators() {
  const { indicadores, loading: indicadoresLoading, createIndicador, updateIndicador, deleteIndicador, refetch } = useIndicadoresGerais();
  const { tiposIndicadores, loading: tiposLoading } = useTiposIndicadoresGerais();

  const tiposAtivos = useMemo(() => tiposIndicadores.filter((t) => t.ativo).sort((a, b) => a.nome.localeCompare(b.nome)), [tiposIndicadores]);
  const tiposById = useMemo(() => new Map(tiposIndicadores.map((t) => [t.id, t])), [tiposIndicadores]);

  /** Registro existente para tipo+competência ('YYYY-MM')? Backstop da UNIQUE do banco. */
  const findRegistro = (tipoId: string, competencia: string): IndicadorGeral | undefined => {
    const data = competenciaToDate(competencia);
    return indicadores.find((i) => i.tipo_indicador_id === tipoId && (i.competencia === data || i.competencia?.slice(0, 7) === competencia));
  };

  return {
    indicadores, tiposIndicadores, tiposAtivos, tiposById,
    loading: indicadoresLoading || tiposLoading,
    indicadoresLoading,
    createIndicador, updateIndicador, deleteIndicador, refetch,
    findRegistro,
  };
}

export type UseGeneralIndicatorsReturn = ReturnType<typeof useGeneralIndicators>;
