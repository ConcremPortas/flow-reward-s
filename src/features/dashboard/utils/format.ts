// Formatadores — funções puras. Delegam ao utilitário central @/lib/formatters
// (fonte única de pt-BR/BRL); aqui ficam apenas os wrappers de domínio do dashboard.
import type { MetricFormat } from '../types';
import { formatCurrencyBRL, formatNumberBR, formatPercentBR } from '@/lib/formatters';

export const fmtInt = (v: number): string => formatNumberBR(v);

export const fmtPct = (v: number, digits = 1): string => formatPercentBR(v, digits);

export const fmtCurrency = (v: number): string => formatCurrencyBRL(v);

export function fmtMetric(value: number, format: MetricFormat): string {
  if (format === 'currency') return fmtCurrency(value);
  if (format === 'pct') return fmtPct(value);
  return fmtInt(value);
}

/** Delta absoluto com sinal, respeitando o formato. */
export function fmtDelta(delta: number, format: MetricFormat): string {
  const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
  const abs = Math.abs(delta);
  const body = format === 'currency' ? fmtCurrency(abs) : format === 'pct' ? fmtPct(abs) : fmtInt(abs);
  return `${sign}${body}`;
}

/** Percentual de variação com sinal: '+12,3%'. */
export function fmtDeltaPct(pct: number): string {
  const sign = pct > 0 ? '+' : pct < 0 ? '−' : '';
  return `${sign}${formatPercentBR(Math.abs(pct), 1)}`;
}

/** Variação percentual entre dois valores (null se base 0/ausente). */
export function deltaPct(value: number | null, previous: number | null): number | null {
  if (value == null || previous == null || previous === 0) return null;
  return ((value - previous) / Math.abs(previous)) * 100;
}
