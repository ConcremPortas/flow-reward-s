import type { StockStatus } from '../types/inventory.types';

/**
 * Situação/alerta de estoque baseada no mínimo EFETIVO (decisão §16):
 * mínimo do saldo por unidade → fallback do padrão da variante → fallback 0.
 * Alerta quando `quantidade <= mínimo efetivo`.
 */
export function minimoEfetivo(minimoUnidade: number | null | undefined, minimoVariante: number | null | undefined): number {
  if (typeof minimoUnidade === 'number' && minimoUnidade >= 0) return minimoUnidade;
  if (typeof minimoVariante === 'number' && minimoVariante >= 0) return minimoVariante;
  return 0;
}

export function statusEstoque(quantidade: number, minimo: number): StockStatus {
  if (quantidade <= 0) return 'SEM_ESTOQUE';
  if (quantidade <= minimo) return 'ALERTA';
  return 'NORMAL';
}

export function isAlerta(quantidade: number, minimo: number): boolean {
  return quantidade <= minimo;
}

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  SEM_ESTOQUE: 'Sem estoque',
  ALERTA: 'Estoque baixo',
  NORMAL: 'Normal',
};
