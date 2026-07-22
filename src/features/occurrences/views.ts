import { ClipboardList, BarChart3, History, UploadCloud, type LucideIcon } from 'lucide-react';

export type OccurrenceView = 'lancamento' | 'analise' | 'historico' | 'importacoes';

export interface OccurrenceViewDef {
  key: OccurrenceView;
  label: string;
  icon: LucideIcon;
}

export const OCCURRENCE_VIEWS: OccurrenceViewDef[] = [
  { key: 'lancamento', label: 'Lançamento Mensal', icon: ClipboardList },
  { key: 'analise', label: 'Análise do Período', icon: BarChart3 },
  { key: 'historico', label: 'Histórico', icon: History },
  { key: 'importacoes', label: 'Importações', icon: UploadCloud },
];

export const DEFAULT_OCCURRENCE_VIEW: OccurrenceView = 'lancamento';

export function isOccurrenceView(v: string | null): v is OccurrenceView {
  return !!v && OCCURRENCE_VIEWS.some((x) => x.key === v);
}
export function normalizeOccurrenceView(v: string | null): OccurrenceView {
  return isOccurrenceView(v) ? v : DEFAULT_OCCURRENCE_VIEW;
}
