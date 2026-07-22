import { StatusBadge } from '@/components/app/StatusBadge';
import { SITUACAO_META } from '../domain/indicatorStatus';
import type { GeneralSituacao } from '../types/general-indicators.types';

/** Badge de situação de NEGÓCIO do indicador (não é qualidade do dado). */
export function GeneralIndicatorStatusBadge({ situacao }: { situacao: GeneralSituacao }) {
  const meta = SITUACAO_META[situacao];
  return <StatusBadge variant={meta.variant}>{meta.label}</StatusBadge>;
}
