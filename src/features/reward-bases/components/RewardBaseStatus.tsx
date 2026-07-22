import { StatusBadge } from '@/components/app/StatusBadge';
import { REWARD_BASE_STATUS_META } from '../domain/rewardBaseStatus';
import type { RewardBaseStatus as Status } from '../types/reward-base.types';

export function RewardBaseStatus({ status }: { status: Status }) {
  const meta = REWARD_BASE_STATUS_META[status.status];
  return <StatusBadge variant={meta.variant}>{meta.label}</StatusBadge>;
}
