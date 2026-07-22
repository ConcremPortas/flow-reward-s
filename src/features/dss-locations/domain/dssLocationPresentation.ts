// Apresentação/normalização de locais de DSS — pura. NÃO altera o dado persistido.

/** Normaliza para comparação (trim, minúsculas, sem acento, espaços colapsados). */
export function normalizeStr(s: string | null | undefined): string {
  return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * A descrição só deve ser exibida como texto secundário quando ACRESCENTA
 * contexto: não vazia e diferente (normalizada) do nome. Evita repetir o nome.
 */
export function shouldShowDescription(nome: string, descricao: string | null | undefined): boolean {
  const d = (descricao ?? '').trim();
  if (!d) return false;
  return normalizeStr(d) !== normalizeStr(nome);
}
