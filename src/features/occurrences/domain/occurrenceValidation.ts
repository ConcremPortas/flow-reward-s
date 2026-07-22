// Validação da quantidade de faltas/advertências — regra centralizada.
// Regra real do domínio (GerarPremiacoes.tsx / calculoPremiacao.ts): a nota já
// satura em 0 a partir de 4 ocorrências (calcularNotaFaltas/calcularNotaAdvertencias).
// Não existe um teto de cadastro no banco (a coluna aceita qualquer inteiro >= 0);
// por isso NÃO impomos um máximo de digitação — apenas orientamos visualmente
// quando o valor ultrapassa o ponto em que a nota já é zero.
import type { OccurrenceEntry, OccurrenceRowKind } from '../types';

export const NOTA_ZERO_THRESHOLD = 4;

/** Sanitiza uma entrada de teclado/incremento para um inteiro >= 0 (nunca negativo, nunca fracionário). */
export function sanitizeQuantity(raw: string | number): number {
  const n = typeof raw === 'number' ? raw : parseInt(raw, 10);
  if (!Number.isFinite(n) || Number.isNaN(n)) return 0;
  return Math.max(0, Math.trunc(n));
}

export function isValidQuantity(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

interface RowStatusInput {
  baseline: OccurrenceEntry | undefined;
  current: OccurrenceEntry | undefined;
}

/** Deriva o estado de interface de uma linha (não persistido). */
export function deriveRowStatus({ baseline, current }: RowStatusInput): OccurrenceRowKind {
  const cur = current ?? { faltas: 0, advertencias: 0 };
  const base = baseline ?? { faltas: 0, advertencias: 0 };
  const changed = cur.faltas !== base.faltas || cur.advertencias !== base.advertencias;
  const hasOccurrence = cur.faltas > 0 || cur.advertencias > 0;

  if (!isValidQuantity(cur.faltas) || !isValidQuantity(cur.advertencias)) return 'erro';
  if (changed) return 'alterado';
  if (hasOccurrence) return 'com_ocorrencia';
  return 'sem_alteracao';
}
