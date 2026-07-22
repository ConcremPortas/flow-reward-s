// Validação/normalização de tipo de indicador setorial — pura.
//
// Códigos existentes: HM, ID, L, NC, OPC (1–3 letras). NÃO impor tamanho fixo
// (existe OPC com 3). Códigos são armazenados em MAIÚSCULAS. Comparação de
// duplicidade por código normalizado (caixa) e por nome (caixa/espaços).

/** Normaliza o código para comparação/persistência: apara e MAIÚSCULAS. */
export function normalizeCodigo(codigo: string | null | undefined): string {
  return (codigo ?? '').trim().toUpperCase();
}

export function normalizeNome(nome: string | null | undefined): string {
  return (nome ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function toPersistedNome(nome: string): string {
  return (nome ?? '').trim();
}

/** Código válido: não vazio, sem espaços, apenas letras/números (após maiúsculas). */
export function isValidCodigo(codigo: string): boolean {
  const c = normalizeCodigo(codigo);
  return c.length > 0 && /^[A-Z0-9]+$/.test(c);
}

export function isValidNome(nome: string): boolean {
  return toPersistedNome(nome).length > 0;
}
