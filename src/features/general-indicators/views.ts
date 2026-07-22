import { LayoutDashboard, TrendingUp, History, type LucideIcon } from 'lucide-react';

export type GeneralIndicatorView = 'geral' | 'evolucao' | 'historico';

export interface GeneralIndicatorViewDef { key: GeneralIndicatorView; label: string; icon: LucideIcon }

export const GENERAL_INDICATOR_VIEWS: GeneralIndicatorViewDef[] = [
  { key: 'geral', label: 'Visão Geral', icon: LayoutDashboard },
  { key: 'evolucao', label: 'Evolução e Comparação', icon: TrendingUp },
  { key: 'historico', label: 'Histórico', icon: History },
];

export const DEFAULT_GENERAL_INDICATOR_VIEW: GeneralIndicatorView = 'geral';

export function isGeneralIndicatorView(v: string | null): v is GeneralIndicatorView {
  return !!v && GENERAL_INDICATOR_VIEWS.some((x) => x.key === v);
}
export function normalizeGeneralIndicatorView(v: string | null): GeneralIndicatorView {
  return isGeneralIndicatorView(v) ? v : DEFAULT_GENERAL_INDICATOR_VIEW;
}
