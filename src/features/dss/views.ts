import { ClipboardEdit, History, BarChart3, type LucideIcon } from 'lucide-react';

export type DssView = 'registro' | 'historico' | 'indicadores';

export interface DssViewDef { key: DssView; label: string; icon: LucideIcon }

export const DSS_VIEWS: DssViewDef[] = [
  { key: 'registro', label: 'Registrar DSS', icon: ClipboardEdit },
  { key: 'historico', label: 'Histórico', icon: History },
  { key: 'indicadores', label: 'Indicadores', icon: BarChart3 },
];

export const DEFAULT_DSS_VIEW: DssView = 'registro';

export function isDssView(v: string | null): v is DssView {
  return !!v && DSS_VIEWS.some((x) => x.key === v);
}
export function normalizeDssView(v: string | null): DssView {
  return isDssView(v) ? v : DEFAULT_DSS_VIEW;
}
