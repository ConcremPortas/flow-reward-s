import { PlayCircle, ListChecks, ShieldAlert, type LucideIcon } from 'lucide-react';

export type RewardsView = 'novo' | 'processamentos' | 'inconsistencias';

export interface RewardsViewDef { key: RewardsView; label: string; icon: LucideIcon }

export const REWARDS_VIEWS: RewardsViewDef[] = [
  { key: 'novo', label: 'Novo Processamento', icon: PlayCircle },
  { key: 'processamentos', label: 'Processamentos', icon: ListChecks },
  { key: 'inconsistencias', label: 'Inconsistências', icon: ShieldAlert },
];

export const DEFAULT_REWARDS_VIEW: RewardsView = 'novo';

export function normalizeRewardsView(v: string | null): RewardsView {
  return REWARDS_VIEWS.some(x => x.key === v) ? (v as RewardsView) : DEFAULT_REWARDS_VIEW;
}
