// Formatação orientada pela definição do indicador — pt-BR.
// Centraliza a formatação para NÃO espalhar `if (codigo === 'FAT')` pela UI.
import { formatCurrencyBRL, formatNumberBR, formatPercentBR } from '@/lib/formatters';
import type { IndicatorDefinition } from './indicatorDefinitions';

interface FormatOpts {
  /** Forma compacta (ex.: "R$ 18,5 mi", "21,1 mil"). */
  compact?: boolean;
  /** Exibe a unidade textual (ex.: "kits"). Padrão true. */
  withUnit?: boolean;
}

/** Compacta um número em escala pt-BR (mil / mi / bi). */
function compactNumber(value: number, precision = 1): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${formatNumberBR(value / 1_000_000_000, precision)} bi`;
  if (abs >= 1_000_000) return `${formatNumberBR(value / 1_000_000, precision)} mi`;
  if (abs >= 1_000) return `${formatNumberBR(value / 1_000, precision)} mil`;
  return formatNumberBR(value, Number.isInteger(value) ? 0 : precision);
}

/** Formata um valor conforme o formato/unidade do indicador. */
export function formatIndicatorValue(
  value: number | null | undefined,
  def: IndicatorDefinition,
  opts: FormatOpts = {},
): string {
  if (value == null || Number.isNaN(value)) return '—';
  const withUnit = opts.withUnit !== false;

  switch (def.format) {
    case 'currency': {
      if (opts.compact && Math.abs(value) >= 1_000) return `R$ ${compactNumber(value, 1)}`;
      return formatCurrencyBRL(value);
    }
    case 'percent':
      return formatPercentBR(value, def.precision);
    case 'integer':
    case 'quantity': {
      const num = opts.compact && Math.abs(value) >= 10_000 ? compactNumber(value, 1) : formatNumberBR(value, 0);
      return withUnit && def.unit ? `${num} ${def.unit}` : num;
    }
    case 'decimal':
    default: {
      const num = opts.compact && Math.abs(value) >= 10_000 ? compactNumber(value, def.precision) : formatNumberBR(value, def.precision);
      return withUnit && def.unit ? `${num} ${def.unit}` : num;
    }
  }
}

/** Formata um desvio (realizado - meta) com sinal, no formato do indicador. */
export function formatIndicatorDeviation(value: number | null | undefined, def: IndicatorDefinition, opts: FormatOpts = {}): string {
  if (value == null || Number.isNaN(value)) return '—';
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${formatIndicatorValue(Math.abs(value), def, opts)}`;
}
