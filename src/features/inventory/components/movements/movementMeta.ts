import { PackagePlus, ClipboardCheck, Repeat2, SlidersHorizontal, Undo2, ArrowLeftRight, type LucideIcon } from 'lucide-react';
import { MOVEMENT_TYPE_LABEL, MOVEMENT_IS_ENTRADA } from '../../domain/domainConstants';
import type { MovDetalhada } from '../../services/inventoryApi';

export interface TipoMeta { label: string; icon: LucideIcon; classe: string; dot: string }

const META: Record<string, TipoMeta> = {
  ENTRADA: { label: 'Entrada', icon: PackagePlus, classe: 'bg-success/10 text-success', dot: 'bg-success' },
  ENTREGA: { label: 'Entrega', icon: ClipboardCheck, classe: 'bg-status-warning/10 text-status-warning', dot: 'bg-status-warning' },
  DEVOLUCAO: { label: 'Devolução', icon: Repeat2, classe: 'bg-[hsl(217_90%_55%)]/10 text-[hsl(217_90%_45%)]', dot: 'bg-[hsl(217_90%_55%)]' },
  AJUSTE_ENTRADA: { label: 'Ajuste (+)', icon: SlidersHorizontal, classe: 'bg-[hsl(280_65%_60%)]/10 text-[hsl(280_60%_45%)]', dot: 'bg-[hsl(280_65%_60%)]' },
  AJUSTE_SAIDA: { label: 'Ajuste (−)', icon: SlidersHorizontal, classe: 'bg-[hsl(280_65%_60%)]/10 text-[hsl(280_60%_45%)]', dot: 'bg-[hsl(280_65%_60%)]' },
  ESTORNO_ENTREGA: { label: 'Estorno de entrega', icon: Undo2, classe: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
  ESTORNO_DEVOLUCAO: { label: 'Estorno de devolução', icon: Undo2, classe: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
};

export function tipoMeta(tipo: string): TipoMeta {
  return META[tipo] ?? { label: MOVEMENT_TYPE_LABEL[tipo as keyof typeof MOVEMENT_TYPE_LABEL] ?? tipo, icon: ArrowLeftRight, classe: 'bg-muted text-muted-foreground', dot: 'bg-muted-foreground' };
}

export type Direcao = 'IN' | 'OUT' | 'MISTA';
export function direcaoMov(m: MovDetalhada): Direcao {
  if (m.itens.length === 0) return MOVEMENT_IS_ENTRADA[m.tipo as keyof typeof MOVEMENT_IS_ENTRADA] ? 'IN' : 'OUT';
  const temIn = m.itens.some((i) => i.direcao === 'IN');
  const temOut = m.itens.some((i) => i.direcao === 'OUT');
  return temIn && temOut ? 'MISTA' : temIn ? 'IN' : 'OUT';
}
export const totalPecas = (m: MovDetalhada) => m.itens.reduce((a, i) => a + i.quantidade, 0);
export const valorMov = (m: MovDetalhada, custoDe: (varianteId: string) => number) => m.itens.reduce((a, i) => a + i.quantidade * custoDe(i.varianteId), 0);

export const ORIGEM_LABEL: Record<string, string> = { ENTRADA: 'Entrada', ENTREGA: 'Entrega', DEVOLUCAO: 'Devolução', TROCA: 'Troca', AJUSTE: 'Ajuste' };
export const DIRECAO_LABEL: Record<Direcao, string> = { IN: 'Entrada', OUT: 'Saída', MISTA: 'Mista' };
