import { ClipboardList, History, type LucideIcon } from 'lucide-react';

export type SectorIndicatorView = 'apuracao' | 'historico';

export interface SectorIndicatorViewDef { key: SectorIndicatorView; label: string; icon: LucideIcon }

export const SECTOR_INDICATOR_VIEWS: SectorIndicatorViewDef[] = [
  { key: 'apuracao', label: 'Apuração Mensal', icon: ClipboardList },
  { key: 'historico', label: 'Histórico', icon: History },
];

export const DEFAULT_SECTOR_INDICATOR_VIEW: SectorIndicatorView = 'apuracao';

export function isSectorIndicatorView(v: string | null): v is SectorIndicatorView {
  return !!v && SECTOR_INDICATOR_VIEWS.some((x) => x.key === v);
}
export function normalizeSectorIndicatorView(v: string | null): SectorIndicatorView {
  return isSectorIndicatorView(v) ? v : DEFAULT_SECTOR_INDICATOR_VIEW;
}
