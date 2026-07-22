// Validação/normalização de entrada numérica — pt-BR. Puro.
// (Mesma regra usada na apuração de produção; mantido local à feature.)

/**
 * Converte texto do usuário (pt-BR ou en) em número, ou null se vazio/inválido.
 * Aceita "1.234,56", "1234,56", "1234.56", "1234". Mantém decimais.
 */
export function parseNumberBR(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const raw = String(value).trim();
  if (!raw) return null;
  const cleaned =
    raw.includes(',') && raw.includes('.')
      ? raw.replace(/\./g, '').replace(',', '.')
      : raw.includes(',')
        ? raw.replace(',', '.')
        : raw;
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

/**
 * Sanitiza o valor digitado de meta/realizado. Valores negativos não são
 * permitidos (clampados a 0); vazio → null (campo não preenchido).
 */
export function sanitizeIndicatorValue(value: unknown): number | null {
  const n = parseNumberBR(value);
  if (n == null) return null;
  return n < 0 ? 0 : n;
}

/** Mantém apenas caracteres válidos de número pt-BR enquanto o usuário digita. */
export function maskNumericInput(raw: string): string {
  return raw.replace(/[^\d.,]/g, '');
}
