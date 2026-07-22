// Formatação de números, moeda e percentual — pt-BR.
// Reutiliza instâncias de Intl de locale.ts (não recria por chamada) e aceita
// null/undefined com segurança, sem lançar durante a renderização.
import { APP_LOCALE, currencyFormatter, integerFormatter } from './locale';

/** Moeda brasileira: 115981.05 → "R$ 115.981,05". */
export function formatCurrencyBRL(value: number | null | undefined, fallback = 'R$ 0,00'): string {
  if (value == null || Number.isNaN(value)) return fallback;
  return currencyFormatter.format(value);
}

/** Número no padrão brasileiro: 1234.56 → "1.234,56". `digits` fixa as casas decimais. */
export function formatNumberBR(value: number | null | undefined, digits?: number, fallback = '0'): string {
  if (value == null || Number.isNaN(value)) return fallback;
  if (digits == null) return integerFormatter.format(value);
  return new Intl.NumberFormat(APP_LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/**
 * Percentual: 10.5 → "10,5%". O valor já deve estar em escala percentual
 * (10.5 = 10,5%, não 0.105). `digits` controla as casas decimais (padrão 1).
 */
export function formatPercentBR(value: number | null | undefined, digits = 1, fallback = '—'): string {
  if (value == null || Number.isNaN(value)) return fallback;
  return `${formatNumberBR(value, digits)}%`;
}

/**
 * Pluralização simples pt-BR: escolhe singular (n === 1) ou plural.
 * Ex.: pluralizeBR(1, 'funcionário', 'funcionários') → "1 funcionário".
 *      pluralizeBR(3, 'falta', 'faltas') → "3 faltas".
 * O número é formatado no padrão brasileiro (com separador de milhares).
 */
export function pluralizeBR(count: number, singular: string, plural: string): string {
  const word = Math.abs(count) === 1 ? singular : plural;
  return `${formatNumberBR(count)} ${word}`;
}
