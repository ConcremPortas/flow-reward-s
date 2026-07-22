import { Calculator, Grid3x3, type LucideIcon } from 'lucide-react';
import type { RewardFormulasView } from './types/reward-formula.types';

export interface RewardFormulasViewDef { key: RewardFormulasView; label: string; icon: LucideIcon }

export const REWARD_FORMULAS_VIEWS: RewardFormulasViewDef[] = [
  { key: 'formulas', label: 'Fórmulas', icon: Calculator },
  { key: 'cobertura', label: 'Matriz de Cobertura', icon: Grid3x3 },
];

export const DEFAULT_REWARD_FORMULAS_VIEW: RewardFormulasView = 'formulas';

export function normalizeRewardFormulasView(v: string | null): RewardFormulasView {
  return REWARD_FORMULAS_VIEWS.some(x => x.key === v) ? (v as RewardFormulasView) : DEFAULT_REWARD_FORMULAS_VIEW;
}
