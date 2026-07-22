// Validação/duplicidade de local de DSS — pura. Duplicidade só por caixa/espaços
// (sem fuzzy: "Fábrica 01" ≠ "Fábrica 02").
export function normalizeForDuplicate(nome: string | null | undefined): string {
  return (nome ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function toPersistedNome(nome: string): string {
  return (nome ?? '').trim();
}

export function isValidLocalNome(nome: string): boolean {
  return toPersistedNome(nome).length > 0;
}
