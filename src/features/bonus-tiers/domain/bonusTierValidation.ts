// Entrada e validação monetária pt-BR — puras. Reutiliza a formatação global.

/**
 * Converte texto pt-BR (ou simples) em número. Aceita "150", "150,00",
 * "1.250,50", "1250.50". Retorna null se vazio/inválido. Mantém a precisão.
 */
export function parseCurrencyBR(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const raw = String(value).replace(/R\$/gi, '').trim();
  if (!raw) return null;
  const cleaned =
    raw.includes(',') && raw.includes('.')
      ? raw.replace(/\./g, '').replace(',', '.')   // 1.250,50 → 1250.50
      : raw.includes(',')
        ? raw.replace(',', '.')                     // 150,00 → 150.00
        : raw;                                      // 150 | 150.00
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

/** Mantém apenas caracteres válidos de moeda pt-BR enquanto digita. */
export function maskCurrencyInput(raw: string): string {
  return raw.replace(/[^\d.,]/g, '');
}

/** Valor válido para persistir? (>= 0; zero é válido — significa sem bônus base). */
export function isValidTierValue(n: number | null): n is number {
  return n != null && Number.isFinite(n) && n >= 0;
}
