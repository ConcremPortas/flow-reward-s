// Validação/normalização de entrada numérica — pt-BR. Puro.

/**
 * Converte texto do usuário (pt-BR ou en) em número, ou null se vazio/ inválido.
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
 * Sanitiza o valor digitado no input de realizado/meta.
 * Regra atual: valores negativos não são permitidos (o formulário usa números
 * >= 0; a importação rejeita realizado < 0 e meta <= 0). Retorna null para
 * vazio (campo não preenchido) e clampa negativos a 0.
 */
export function sanitizeProductionValue(value: unknown): number | null {
  const n = parseNumberBR(value);
  if (n == null) return null;
  return n < 0 ? 0 : n;
}

/** Mantém apenas caracteres válidos de número pt-BR enquanto o usuário digita. */
export function maskNumericInput(raw: string): string {
  return raw.replace(/[^\d.,]/g, '');
}
