import type { IndicatorTypeMeasurementUsage } from '../types/indicator-type.types';

/** Rótulo textual da utilização (Em uso / Sem medição / Sem correspondência). */
export function IndicatorTypeUsage({ usage }: { usage: IndicatorTypeMeasurementUsage }) {
  if (!usage.temCorrespondencia) return <span className="text-sm text-status-warning">Sem correspondência</span>;
  if (usage.medicoes > 0) return <span className="text-sm text-foreground">Em uso</span>;
  return <span className="text-sm text-muted-foreground">Sem medição</span>;
}
