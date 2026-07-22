import { Coins, Share2, type LucideIcon } from 'lucide-react';

export type RewardBasesView = 'bases' | 'utilizacao';

export interface RewardBasesViewDef { key: RewardBasesView; label: string; icon: LucideIcon }

export const REWARD_BASES_VIEWS: RewardBasesViewDef[] = [
  { key: 'bases', label: 'Bases', icon: Coins },
  { key: 'utilizacao', label: 'Utilização e Regras', icon: Share2 },
];

export const DEFAULT_REWARD_BASES_VIEW: RewardBasesView = 'bases';

export function normalizeRewardBasesView(v: string | null): RewardBasesView {
  return REWARD_BASES_VIEWS.some(x => x.key === v) ? (v as RewardBasesView) : DEFAULT_REWARD_BASES_VIEW;
}
