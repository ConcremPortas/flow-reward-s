// Utilização por tipo de indicador geral — agregação EM LOTE (sem N+1). Puro.
//
// Relação REAL: `concremrh_indicadores_gerais.tipo_indicador_id` → tipo. Conta
// medições, competências distintas e o último registro (por competência) de cada
// tipo, a partir dos dados já carregados.
import type { IndicadorGeral } from '@/hooks/useIndicadoresGerais';
import type { GeneralIndicatorTypeUsage } from '../types/general-indicator-type.types';

export interface TypeMeasurementStats {
  medicoes: number;
  competencias: Set<string>;
  ultimaCompetencia: string | null;
  ultimoRegistro: IndicadorGeral | null;
}

export function buildTypeMeasurementUsage(indicadores: IndicadorGeral[]): Map<string, TypeMeasurementStats> {
  const map = new Map<string, TypeMeasurementStats>();
  for (const reg of indicadores) {
    const id = reg.tipo_indicador_id;
    if (!id) continue;
    if (!map.has(id)) map.set(id, { medicoes: 0, competencias: new Set(), ultimaCompetencia: null, ultimoRegistro: null });
    const s = map.get(id)!;
    s.medicoes += 1;
    if (reg.competencia) {
      s.competencias.add(reg.competencia);
      if (!s.ultimaCompetencia || reg.competencia > s.ultimaCompetencia) {
        s.ultimaCompetencia = reg.competencia;
        s.ultimoRegistro = reg;
      }
    }
  }
  return map;
}

export function usageForType(tipoId: string, stats: Map<string, TypeMeasurementStats>): GeneralIndicatorTypeUsage {
  const s = stats.get(tipoId);
  return {
    medicoes: s?.medicoes ?? 0,
    competencias: s?.competencias.size ?? 0,
    ultimaCompetencia: s?.ultimaCompetencia ?? null,
    ultimoMeta: s?.ultimoRegistro?.meta ?? null,
    ultimoRealizado: s?.ultimoRegistro?.realizado ?? null,
    ultimoPercentual: s?.ultimoRegistro?.percentual ?? null,
  };
}
