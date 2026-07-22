// Validação e normalização para duplicidade de categoria — pura. Detecta apenas
// situações SEGURAS (exatamente igual, diferença de caixa, diferença de espaços).
// NÃO usa similaridade fuzzy: "GERENTE" e "SUBGERENTE" são semanticamente
// distintos e não devem gerar falso alerta.

/** Chave de comparação para duplicidade: apara, colapsa espaços e minúsculas.
 *  Cobre exatamente igual, diferença de caixa e diferença de espaços. Mantém
 *  acentuação (não folda) para não colidir nomes semanticamente distintos. */
export function normalizeForDuplicate(nome: string | null | undefined): string {
  return (nome ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Nome como será persistido (apenas apara extremidades — sem alterar caixa/acento). */
export function toPersistedName(nome: string): string {
  return (nome ?? '').trim();
}

/** Nome válido para persistir (não vazio após aparar). */
export function isValidCategoryName(nome: string): boolean {
  return toPersistedName(nome).length > 0;
}
