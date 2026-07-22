import { StatusBadge } from '@/components/app/StatusBadge';
import { INDICATOR_TYPE_STATUS_META } from '../domain/indicatorTypeStatus';
import type { IndicatorTypeStatus as Status } from '../types/indicator-type.types';

export function IndicatorTypeStatus({ status }: { status: Status }) {
  const meta = INDICATOR_TYPE_STATUS_META[status.status];
  return <StatusBadge variant={meta.variant}>{meta.label}</StatusBadge>;
}
