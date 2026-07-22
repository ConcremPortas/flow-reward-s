// Validação/normalização de tipo de indicador geral — pura.
//
// Códigos existentes: FAT (3), KITS (4) — NÃO impor tamanho fixo. Armazenados em
// MAIÚSCULAS. Duplicidade por código normalizado (caixa) e por nome (caixa/espaços).

export function normalizeCodigo(codigo: string | null | undefined): string {
  return (codigo ?? '').trim().toUpperCase();
}

export function normalizeNome(nome: string | null | undefined): string {
  return (nome ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function toPersistedNome(nome: string): string {
  return (nome ?? '').trim();
}

/** Código válido: não vazio, sem espaços, letras/números. */
export function isValidCodigo(codigo: string): boolean {
  const c = normalizeCodigo(codigo);
  return c.length > 0 && /^[A-Z0-9]+$/.test(c);
}

export function isValidNome(nome: string): boolean {
  return toPersistedNome(nome).length > 0;
}
