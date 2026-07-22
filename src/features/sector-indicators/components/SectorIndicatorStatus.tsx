import { StatusBadge } from '@/components/app/StatusBadge';
import { SITUACAO_META } from '../domain/indicatorStatus';
import type { IndicatorSituacao } from '../types/sector-indicators.types';

/** Badge de situação consolidada do setor. */
export function SectorIndicatorStatus({ situacao }: { situacao: IndicatorSituacao }) {
  const meta = SITUACAO_META[situacao];
  return <StatusBadge variant={meta.variant}>{meta.label}</StatusBadge>;
}
