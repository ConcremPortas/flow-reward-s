// Normalização de nomes de função — PURA, só para COMPARAÇÃO. Nunca persistir o
// resultado nem alterar o nome cadastrado. Fonte única (não espalhar no JSX).

const SEPARATORS_RE = /[-–—:/|]+/g;
const DIACRITICS_RE = /[̀-ͯ]/g;

/** Remove acentos preservando o resto. */
export function stripAccents(s: string): string {
  return (s ?? '').normalize('NFD').replace(DIACRITICS_RE, '');
}

/** Colapsa espaços e apara as extremidades. */
export function collapseSpaces(s: string): string {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

/** Normalização básica: trim + minúsculas + sem acento + espaços colapsados. */
export function normalizeStr(s: string | null | undefined): string {
  return collapseSpaces(stripAccents(s ?? '').toLowerCase());
}

/**
 * Chave de comparação forte: ignora caixa, acentuação e separadores (hífen, dois
 * pontos, barra) — usada para agrupar nomes "equivalentes". Ex.: "MECÂNICO
 * INDUSTRIAL - B" e "MECANICO INDUSTRIAL B" produzem a MESMA chave.
 */
export function comparisonKey(s: string | null | undefined): string {
  const noAccent = stripAccents(s ?? '').toLowerCase();
  return collapseSpaces(noAccent.replace(SEPARATORS_RE, ' '));
}

/** Tokens normalizados (sem separadores), ordenados — para equivalência de tokens. */
export function tokenSet(s: string | null | undefined): string[] {
  const key = comparisonKey(s);
  if (!key) return [];
  return Array.from(new Set(key.split(' ').filter(Boolean))).sort();
}

/** Chave de tokens (ordenada) — nomes com as mesmas palavras em qualquer ordem. */
export function tokenKey(s: string | null | undefined): string {
  return tokenSet(s).join(' ');
}

/** Distância de Levenshtein (iterativa, O(n·m)). */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);
  for (let i = 0; i < a.length; i++) {
    curr[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      curr[j + 1] = Math.min(curr[j] + 1, prev[j + 1] + 1, prev[j] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** Similaridade normalizada [0..1] entre duas strings (1 = idênticas). */
export function similarityRatio(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 1;
  return 1 - levenshtein(a, b) / max;
}
