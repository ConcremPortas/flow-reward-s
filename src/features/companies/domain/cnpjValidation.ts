// Validação de CNPJ — pura. Dígitos verificadores (mód. 11). A máscara não valida
// por si só. NÃO consulta serviços externos.
import { onlyDigits } from './cnpjFormatting';

const PESOS_1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const PESOS_2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

function dv(base: string, pesos: number[]): number {
  const soma = base.split('').reduce((acc, ch, i) => acc + Number(ch) * pesos[i], 0);
  const resto = soma % 11;
  return resto < 2 ? 0 : 11 - resto;
}

/** true se o CNPJ (com ou sem máscara) tem 14 dígitos e DVs válidos. */
export function isValidCNPJ(v: string | null | undefined): boolean {
  const d = onlyDigits(v);
  if (d.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(d)) return false; // todos iguais
  const dv1 = dv(d.slice(0, 12), PESOS_1);
  const dv2 = dv(d.slice(0, 12) + dv1, PESOS_2);
  return d[12] === String(dv1) && d[13] === String(dv2);
}

/** Há algum dígito informado? (para distinguir "ausente" de "inválido"). */
export function hasCNPJValue(v: string | null | undefined): boolean {
  return onlyDigits(v).length > 0;
}

/** CNPJ completo em quantidade de dígitos (14), mesmo que DV inválido. */
export function isCNPJComplete(v: string | null | undefined): boolean {
  return onlyDigits(v).length === 14;
}
