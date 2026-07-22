// Regras de dependência para exclusão — puras.
//
// A exclusão é HARD DELETE. Bloqueamos quando há medições (registros em
// concremrh_indicadores_gerais via FK) — evita o erro de FK e preserva o histórico.
import type { GeneralIndicatorTypeUsage } from '../types/general-indicator-type.types';

export function hasMeasurements(usage: GeneralIndicatorTypeUsage): boolean {
  return usage.medicoes > 0;
}

export function hasActiveLinks(usage: GeneralIndicatorTypeUsage): boolean {
  return hasMeasurements(usage);
}
