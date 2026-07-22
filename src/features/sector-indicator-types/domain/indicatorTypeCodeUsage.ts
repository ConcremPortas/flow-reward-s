// Utilização por tipo — derivada por CORRESPONDÊNCIA SEMÂNTICA código↔coluna. Puro.
//
// `concremrh_tipos_indicadores` NÃO tem FK para as medições. As medições estão em
// `concremrh_indicadores_setor` em colunas fixas. Mapeamos o CÓDIGO do catálogo
// para o prefixo da coluna correspondente e contamos, EM LOTE, quantos registros
// têm valor (meta ou realizado) nessa coluna — junto com setores e competências
// distintos. Códigos fora do conjunto conhecido não têm correspondência de medição.
import type { IndicadorSetor } from '@/hooks/useIndicadoresSetor';
import type { IndicatorTypeMeasurementUsage } from '../types/indicator-type.types';
import { normalizeCodigo } from './indicatorTypeValidation';

/** Correspondência observacional (por significado) entre código e coluna de medição. */
export const CODE_COLUMN_MAP: Record<string, string> = {
  HM: 'hora_maquina',
  ID: 'identificacao_nc',
  L: 'limpeza',
  NC: 'tratamento_nc',
  OPC: 'operacao_segura',
};

export interface MeasurementColumnStats {
  medicoes: number;
  setores: Set<string>;
  competencias: Set<string>;
  ultimaCompetencia: string | null;
}

/** Agrega, uma única vez, estatísticas por coluna de medição (sem N+1). */
export function buildMeasurementUsage(indicadores: IndicadorSetor[]): Map<string, MeasurementColumnStats> {
  const stats = new Map<string, MeasurementColumnStats>();
  const ensure = (col: string) => {
    if (!stats.has(col)) stats.set(col, { medicoes: 0, setores: new Set(), competencias: new Set(), ultimaCompetencia: null });
    return stats.get(col)!;
  };

  for (const ind of indicadores) {
    const rec = ind as unknown as Record<string, number | string | undefined>;
    for (const col of new Set(Object.values(CODE_COLUMN_MAP))) {
      const meta = rec[`${col}_meta`];
      const realizado = rec[`${col}_realizado`];
      const temValor = (meta != null && meta !== '') || (realizado != null && realizado !== '');
      if (!temValor) continue;
      const s = ensure(col);
      s.medicoes += 1;
      if (ind.setor_id) s.setores.add(ind.setor_id);
      if (ind.competencia) {
        s.competencias.add(ind.competencia);
        if (!s.ultimaCompetencia || ind.competencia > s.ultimaCompetencia) s.ultimaCompetencia = ind.competencia;
      }
    }
  }
  return stats;
}

export function usageForCode(codigo: string, stats: Map<string, MeasurementColumnStats>): IndicatorTypeMeasurementUsage {
  const coluna = CODE_COLUMN_MAP[normalizeCodigo(codigo)] ?? null;
  if (!coluna) {
    return { temCorrespondencia: false, coluna: null, medicoes: 0, setores: 0, competencias: 0, ultimaCompetencia: null };
  }
  const s = stats.get(coluna);
  return {
    temCorrespondencia: true,
    coluna,
    medicoes: s?.medicoes ?? 0,
    setores: s?.setores.size ?? 0,
    competencias: s?.competencias.size ?? 0,
    ultimaCompetencia: s?.ultimaCompetencia ?? null,
  };
}
