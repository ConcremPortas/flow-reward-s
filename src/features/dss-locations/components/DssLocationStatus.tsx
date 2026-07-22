import { StatusBadge } from '@/components/app/StatusBadge';
import { DSS_LOCATION_STATUS_META } from '../domain/dssLocationStatus';
import type { DssLocationStatus as Status } from '../types/dss-location.types';

export function DssLocationStatus({ status }: { status: Status }) {
  const meta = DSS_LOCATION_STATUS_META[status.status];
  return <StatusBadge variant={meta.variant}>{meta.label}</StatusBadge>;
}
