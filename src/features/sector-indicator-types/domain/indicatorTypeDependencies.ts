// Regras de dependência para exclusão — puras.
//
// "Vínculos" de um tipo = medições registradas na coluna correspondente (por
// correspondência semântica). Como não há FK, o "bloqueio" de exclusão baseia-se
// nas medições observadas: havendo medições, a exclusão é bloqueada (o catálogo
// perde o rótulo de dados existentes). A exclusão é SOFT (ativo=false).
import type { IndicatorTypeMeasurementUsage } from '../types/indicator-type.types';

export function hasMeasurements(usage: IndicatorTypeMeasurementUsage): boolean {
  return usage.medicoes > 0;
}

/** Exclusão bloqueada quando há medições vinculadas ao código. */
export function hasActiveLinks(usage: IndicatorTypeMeasurementUsage): boolean {
  return hasMeasurements(usage);
}
