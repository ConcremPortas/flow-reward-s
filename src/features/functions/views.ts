import { Briefcase, GitCompare, type LucideIcon } from 'lucide-react';

export type FunctionsView = 'funcoes' | 'padronizacao';

export interface FunctionsViewDef { key: FunctionsView; label: string; icon: LucideIcon }

export const FUNCTIONS_VIEWS: FunctionsViewDef[] = [
  { key: 'funcoes', label: 'Funções', icon: Briefcase },
  { key: 'padronizacao', label: 'Uso e Padronização', icon: GitCompare },
];

export const DEFAULT_FUNCTIONS_VIEW: FunctionsView = 'funcoes';

export function normalizeFunctionsView(v: string | null): FunctionsView {
  return FUNCTIONS_VIEWS.some(x => x.key === v) ? (v as FunctionsView) : DEFAULT_FUNCTIONS_VIEW;
}
