import { StatusBadge } from '@/components/app/StatusBadge';
import { SITUACAO_META } from '../domain/productionStatus';
import type { ProductionSituacao } from '../types/production-entry.types';

/** Badge de situação — mapeia a situação do domínio para o StatusBadge padrão. */
export function ProductionStatusBadge({ situacao }: { situacao: ProductionSituacao }) {
  const meta = SITUACAO_META[situacao];
  return <StatusBadge variant={meta.variant}>{meta.label}</StatusBadge>;
}
