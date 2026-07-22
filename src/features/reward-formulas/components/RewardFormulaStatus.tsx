import { StatusBadge } from '@/components/app/StatusBadge';
import { FORMULA_STATUS_META } from '../domain/rewardFormulaStatus';
import type { FormulaStatus } from '../types/reward-formula.types';

export function RewardFormulaStatus({ status }: { status: FormulaStatus }) {
  const meta = FORMULA_STATUS_META[status.status];
  return <StatusBadge variant={meta.variant}>{meta.label}</StatusBadge>;
}
