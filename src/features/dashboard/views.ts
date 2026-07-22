// Configuração das 5 visões paginadas da Central Analítica de RH.
import { LayoutDashboard, Users, ShieldCheck, LayoutGrid, Coins, type LucideIcon } from 'lucide-react';

export type ViewKey = 'executivo' | 'pessoas' | 'saude' | 'setores' | 'premiacao';

export interface ViewDef {
  key: ViewKey;
  num: string;
  label: string;
  short: string;
  icon: LucideIcon;
}

export const VIEWS: ViewDef[] = [
  { key: 'executivo', num: '01', label: 'Visão Executiva', short: 'Executiva', icon: LayoutDashboard },
  { key: 'pessoas', num: '02', label: 'Pessoas e Movimentação', short: 'Pessoas', icon: Users },
  { key: 'saude', num: '03', label: 'Saúde e Segurança', short: 'Saúde', icon: ShieldCheck },
  { key: 'setores', num: '04', label: 'Performance dos Setores', short: 'Setores', icon: LayoutGrid },
  { key: 'premiacao', num: '05', label: 'Premiação e Impacto', short: 'Premiação', icon: Coins },
];

export const DEFAULT_VIEW: ViewKey = 'executivo';

export function isViewKey(v: string | null): v is ViewKey {
  return !!v && VIEWS.some((x) => x.key === v);
}
export function normalizeView(v: string | null): ViewKey {
  return isViewKey(v) ? v : DEFAULT_VIEW;
}
export function viewIndex(v: ViewKey): number {
  return VIEWS.findIndex((x) => x.key === v);
}
export function prevView(v: ViewKey): ViewDef | null {
  const i = viewIndex(v);
  return i > 0 ? VIEWS[i - 1] : null;
}
export function nextView(v: ViewKey): ViewDef | null {
  const i = viewIndex(v);
  return i < VIEWS.length - 1 ? VIEWS[i + 1] : null;
}
