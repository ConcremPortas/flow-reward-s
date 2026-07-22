import { Building2, Network, type LucideIcon } from 'lucide-react';

export type SectorsView = 'setores' | 'liderancas';

export interface SectorsViewDef { key: SectorsView; label: string; icon: LucideIcon }

export const SECTORS_VIEWS: SectorsViewDef[] = [
  { key: 'setores', label: 'Setores', icon: Building2 },
  { key: 'liderancas', label: 'Estrutura de Liderança', icon: Network },
];

export const DEFAULT_SECTORS_VIEW: SectorsView = 'setores';

export function normalizeSectorsView(v: string | null): SectorsView {
  return SECTORS_VIEWS.some(x => x.key === v) ? (v as SectorsView) : DEFAULT_SECTORS_VIEW;
}
