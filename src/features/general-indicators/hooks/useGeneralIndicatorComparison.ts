import { useMemo } from 'react';
import type { TipoIndicadorGeral } from '@/hooks/useTiposIndicadoresGerais';
import type { GeneralIndicatorPoint } from '../types/general-indicators.types';
import { resolveIndicatorDefinition } from '../domain/indicatorDefinitions';
import { compareIndicator, type ComparisonRow } from '../domain/indicatorComparison';

/** Monta as linhas de comparação entre duas competências para os tipos ativos. */
export function useGeneralIndicatorComparison(
  tiposAtivos: TipoIndicadorGeral[],
  pointsByTipo: Map<string, GeneralIndicatorPoint[]>,
  competenciaAtual: string,
  competenciaAnterior: string,
): ComparisonRow[] {
  return useMemo(() => tiposAtivos.map((tipo) => {
    const def = resolveIndicatorDefinition(tipo.codigo, tipo.nome);
    return compareIndicator(pointsByTipo.get(tipo.id) ?? [], competenciaAtual, competenciaAnterior, {
      tipoId: tipo.id, codigo: def.code, label: tipo.nome,
    });
  }), [tiposAtivos, pointsByTipo, competenciaAtual, competenciaAnterior]);
}
