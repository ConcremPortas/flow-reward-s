import { ClipboardCheck, AlertTriangle, History, BarChart3, type LucideIcon } from 'lucide-react';

export type EpiView = 'auditoria' | 'nao-conformidades' | 'historico' | 'indicadores';

export interface EpiViewDef { key: EpiView; label: string; icon: LucideIcon }

export const EPI_VIEWS: EpiViewDef[] = [
  { key: 'auditoria', label: 'Nova Auditoria', icon: ClipboardCheck },
  { key: 'nao-conformidades', label: 'Não Conformidades', icon: AlertTriangle },
  { key: 'historico', label: 'Histórico', icon: History },
  { key: 'indicadores', label: 'Indicadores', icon: BarChart3 },
];

export const DEFAULT_EPI_VIEW: EpiView = 'auditoria';

export function isEpiView(v: string | null): v is EpiView {
  return !!v && EPI_VIEWS.some((x) => x.key === v);
}
export function normalizeEpiView(v: string | null): EpiView {
  return isEpiView(v) ? v : DEFAULT_EPI_VIEW;
}
