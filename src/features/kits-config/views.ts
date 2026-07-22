import { CalendarClock, Calculator, type LucideIcon } from 'lucide-react';

export type KitsConfigView = 'regras' | 'simulador';

export interface KitsConfigViewDef { key: KitsConfigView; label: string; icon: LucideIcon }

export const KITS_CONFIG_VIEWS: KitsConfigViewDef[] = [
  { key: 'regras', label: 'Regras e Vigências', icon: CalendarClock },
  { key: 'simulador', label: 'Simulador', icon: Calculator },
];

export const DEFAULT_KITS_CONFIG_VIEW: KitsConfigView = 'regras';

export function normalizeKitsConfigView(v: string | null): KitsConfigView {
  return KITS_CONFIG_VIEWS.some(x => x.key === v) ? (v as KitsConfigView) : DEFAULT_KITS_CONFIG_VIEW;
}
