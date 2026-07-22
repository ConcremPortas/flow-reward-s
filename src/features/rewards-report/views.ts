import { LayoutDashboard, Users, GitCompareArrows, type LucideIcon } from 'lucide-react';

export type ReportView = 'resumo' | 'funcionarios' | 'conciliacao';

export interface ReportViewDef { key: ReportView; label: string; icon: LucideIcon }

export const REPORT_VIEWS: ReportViewDef[] = [
  { key: 'resumo', label: 'Resumo Executivo', icon: LayoutDashboard },
  { key: 'funcionarios', label: 'Resultados por Funcionário', icon: Users },
  { key: 'conciliacao', label: 'Conciliação', icon: GitCompareArrows },
];

export const DEFAULT_REPORT_VIEW: ReportView = 'resumo';

export function normalizeReportView(v: string | null): ReportView {
  return REPORT_VIEWS.some(x => x.key === v) ? (v as ReportView) : DEFAULT_REPORT_VIEW;
}
