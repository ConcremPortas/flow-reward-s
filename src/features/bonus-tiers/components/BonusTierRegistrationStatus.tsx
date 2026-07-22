import { StatusBadge } from '@/components/app/StatusBadge';
import { TIER_STATUS_META } from '../domain/bonusTierRegistrationStatus';
import type { TierRegistrationStatus } from '../types/bonus-tier.types';

export function BonusTierRegistrationStatus({ status }: { status: TierRegistrationStatus }) {
  const meta = TIER_STATUS_META[status.status];
  return <StatusBadge variant={meta.variant}>{meta.label}</StatusBadge>;
}
