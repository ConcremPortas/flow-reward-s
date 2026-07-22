import { StatusBadge } from '@/components/app/StatusBadge';
import { GENERAL_INDICATOR_TYPE_STATUS_META } from '../domain/generalIndicatorTypeStatus';
import type { GeneralIndicatorTypeStatus as Status } from '../types/general-indicator-type.types';

export function GeneralIndicatorTypeStatus({ status }: { status: Status }) {
  const meta = GENERAL_INDICATOR_TYPE_STATUS_META[status.status];
  return <StatusBadge variant={meta.variant}>{meta.label}</StatusBadge>;
}
