// Validação e normalização de empresa — pura.
import { onlyDigits } from './cnpjFormatting';

export function toPersistedName(nome: string): string {
  return (nome ?? '').trim();
}

export function isValidCompanyName(nome: string): boolean {
  return toPersistedName(nome).length > 0;
}

/** Normaliza nome para comparação (caixa/espaços) — aviso informativo apenas. */
export function normalizeName(nome: string | null | undefined): string {
  return (nome ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Chave de comparação de CNPJ (só dígitos). Vazio quando não informado. */
export function cnpjKey(cnpj: string | null | undefined): string {
  return onlyDigits(cnpj);
}
