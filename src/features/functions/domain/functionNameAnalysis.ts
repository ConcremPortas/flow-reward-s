// Análise de qualidade do PRÓPRIO nome (determinística, observacional). Detecta
// apenas problemas de formatação inequívocos (espaços) — nunca altera o dado.
// Diferenças de caixa/acentuação/separador são CROSS-função e vivem em
// `functionSimilarity` (não fazem sentido isoladamente num único nome).
import type { NameQuality, NameQualityIssue } from '../types/function.types';

export function analyzeFunctionName(nome: string): NameQuality {
  const raw = nome ?? '';
  const issues: NameQualityIssue[] = [];

  if (raw !== raw.trim()) {
    issues.push({ kind: 'espacos_extremidades', label: 'Espaços no início ou fim do nome.' });
  }
  if (/\s{2,}/.test(raw.trim())) {
    issues.push({ kind: 'espacos_duplicados', label: 'Espaços duplicados no meio do nome.' });
  }

  return { issues, hasIssues: issues.length > 0 };
}

/** Nome como será persistido (apenas apara extremidades — sem mexer em caixa/acento). */
export function toPersistedName(nome: string): string {
  return (nome ?? '').trim();
}
