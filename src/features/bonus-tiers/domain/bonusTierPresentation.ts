// Helpers de apresentação/normalização — puros.

/** Normaliza para comparação (trim, minúsculas, sem acentos, espaços colapsados). */
export function normalizeStr(s: string | null | undefined): string {
  return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
}
