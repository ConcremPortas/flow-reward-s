import { ClipboardList, History, UploadCloud, type LucideIcon } from 'lucide-react';

export type ProductionView = 'apuracao' | 'historico' | 'importacoes';

export interface ProductionViewDef { key: ProductionView; label: string; icon: LucideIcon }

export const PRODUCTION_VIEWS: ProductionViewDef[] = [
  { key: 'apuracao', label: 'Apuração Mensal', icon: ClipboardList },
  { key: 'historico', label: 'Histórico', icon: History },
  { key: 'importacoes', label: 'Importações', icon: UploadCloud },
];

export const DEFAULT_PRODUCTION_VIEW: ProductionView = 'apuracao';

export function isProductionView(v: string | null): v is ProductionView {
  return !!v && PRODUCTION_VIEWS.some((x) => x.key === v);
}
export function normalizeProductionView(v: string | null): ProductionView {
  return isProductionView(v) ? v : DEFAULT_PRODUCTION_VIEW;
}
