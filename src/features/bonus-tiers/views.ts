import { Layers, Share2, type LucideIcon } from 'lucide-react';

export type BonusTiersView = 'faixas' | 'vinculos';

export interface BonusTiersViewDef { key: BonusTiersView; label: string; icon: LucideIcon }

export const BONUS_TIERS_VIEWS: BonusTiersViewDef[] = [
  { key: 'faixas', label: 'Faixas', icon: Layers },
  { key: 'vinculos', label: 'Vínculos e Utilização', icon: Share2 },
];

export const DEFAULT_BONUS_TIERS_VIEW: BonusTiersView = 'faixas';

export function normalizeBonusTiersView(v: string | null): BonusTiersView {
  return BONUS_TIERS_VIEWS.some(x => x.key === v) ? (v as BonusTiersView) : DEFAULT_BONUS_TIERS_VIEW;
}
