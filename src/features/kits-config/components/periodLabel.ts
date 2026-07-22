import { competenciaLabelLong } from '@/features/dashboard/utils/dates';
import type { KitsConfigRow } from '../types/kits-config.types';

/** Rótulo amigável do período efetivo (competências, sem timezone). */
export function periodLabel(row: KitsConfigRow): string {
  const inicio = row.sentinela ? 'Regra inicial' : competenciaLabelLong(row.period.inicio);
  if (row.state.state === 'programada') return `${inicio} em diante`;
  if (row.period.emDiante) return `${inicio} até atual`;
  return `${inicio} até ${competenciaLabelLong(row.period.fim!)}`;
}

/** Rótulo curto de vigência (ou "Regra inicial" para sentinela). */
export function vigenciaLabel(row: KitsConfigRow): string {
  return row.sentinela ? 'Regra inicial' : competenciaLabelLong(row.vigenciaInicio);
}
