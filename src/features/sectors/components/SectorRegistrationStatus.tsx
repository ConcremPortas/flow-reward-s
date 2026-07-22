import { StatusBadge } from '@/components/app/StatusBadge';
import { STATUS_META } from '../domain/sectorRegistrationStatus';
import type { RegistrationStatus } from '../types/sector.types';

export function SectorRegistrationStatus({ status }: { status: RegistrationStatus }) {
  const meta = STATUS_META[status.status];
  return <StatusBadge variant={meta.variant}>{meta.label}</StatusBadge>;
}
