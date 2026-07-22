// Formatação de datas, horários e competências — pt-BR / America/Sao_Paulo.
//
// Duas categorias distintas, tratadas de formas diferentes:
//
// 1. DATA CIVIL (sem horário): "YYYY-MM-DD" (admissão, nascimento, realização).
//    NÃO representa um instante — não sofre conversão de fuso. O dia escolhido
//    pelo usuário permanece idêntico após salvar/recarregar.
//
// 2. INSTANTE (timestamp): "...T...Z" ou Date (criado_em, atualizado_em, agora).
//    Representa um ponto no tempo em UTC — convertido para o horário de
//    Brasília na exibição.
//
// Todas as funções aceitam null/undefined com segurança e nunca lançam durante
// a renderização (retornam o fallback informado).
import {
  APP_TIME_ZONE,
  civilDateFormatter,
  civilLongDateFormatter,
  civilMonthYearFormatter,
  dateTimeFormatter,
  relativeTimeFormatter,
  timeFormatter,
} from './locale';

const DATE_ONLY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const COMPETENCIA_RE = /^(\d{4})-(\d{2})$/;

type DateInput = string | number | Date | null | undefined;

/** Constrói um Date em UTC a partir dos componentes civis (sem shift de fuso). */
function civilToUtcDate(year: number, month1to12: number, day: number): Date {
  return new Date(Date.UTC(year, month1to12 - 1, day, 0, 0, 0));
}

/**
 * Interpreta "YYYY-MM-DD" como data civil, retornando um Date em UTC (meia-noite
 * UTC daquele dia). Retorna null para entradas ausentes ou inválidas.
 */
export function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = DATE_ONLY_RE.exec(value.trim());
  if (!m) {
    // Aceita também a parte de data de um timestamp ("YYYY-MM-DDT...").
    const iso = value.slice(0, 10);
    const m2 = DATE_ONLY_RE.exec(iso);
    if (!m2) return null;
    return validCivil(+m2[1], +m2[2], +m2[3]);
  }
  return validCivil(+m[1], +m[2], +m[3]);
}

function validCivil(y: number, mo: number, d: number): Date | null {
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const date = civilToUtcDate(y, mo, d);
  // Rejeita datas impossíveis (ex.: 31/02 vira 03/03).
  if (date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return date;
}

/** Converte um Date para "YYYY-MM-DD" usando seus componentes civis (UTC). */
export function dateOnlyToISO(date: Date | null | undefined): string {
  if (!date || Number.isNaN(date.getTime())) return '';
  const y = date.getUTCFullYear();
  const mo = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}

/** Converte diferentes entradas em um instante Date válido, ou null. */
function toInstant(value: DateInput): Date | null {
  if (value == null || value === '') return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ── DATA CIVIL ──────────────────────────────────────────────────────────────

/**
 * Formata uma data civil: 14/07/2026. Aceita "YYYY-MM-DD" (sem shift) ou um
 * instante (Date/timestamp), caso em que usa a data no fuso de Brasília.
 */
export function formatDateBR(value: DateInput, fallback = '—'): string {
  if (value == null || value === '') return fallback;
  if (typeof value === 'string') {
    const civil = parseDateOnly(value);
    if (civil) return civilDateFormatter.format(civil);
    // String de timestamp completo → formata a data no fuso de Brasília.
    const inst = toInstant(value);
    return inst ? dateTimeFormatter.format(inst).split(',')[0].trim() : fallback;
  }
  const inst = toInstant(value);
  return inst ? dateTimeFormatter.format(inst).split(',')[0].trim() : fallback;
}

/** Data civil longa: "segunda-feira, 14 de julho de 2026". */
export function formatLongDateBR(value: string | null | undefined, fallback = '—'): string {
  const civil = parseDateOnly(value);
  return civil ? civilLongDateFormatter.format(civil) : fallback;
}

// ── COMPETÊNCIA (mês/ano) ─────────────────────────────────────────────────────

/** Competência "YYYY-MM" → "julho de 2026". Nunca convertida por fuso. */
export function formatMonthYearBR(competencia: string | null | undefined, fallback = '—'): string {
  if (!competencia) return fallback;
  const m = COMPETENCIA_RE.exec(competencia.trim());
  if (!m) {
    // Aceita "YYYY-MM-DD" e usa apenas ano/mês.
    const civil = parseDateOnly(competencia);
    return civil ? civilMonthYearFormatter.format(civil) : fallback;
  }
  const mes = +m[2];
  if (mes < 1 || mes > 12) return fallback;
  return civilMonthYearFormatter.format(civilToUtcDate(+m[1], mes, 1));
}

// ── INSTANTES (timestamp → Brasília) ──────────────────────────────────────────

/** Instante → "14/07/2026, 13:45" no horário de Brasília. */
export function formatDateTimeBR(value: DateInput, fallback = '—'): string {
  const inst = toInstant(value);
  return inst ? dateTimeFormatter.format(inst) : fallback;
}

/** Instante → "13:45" no horário de Brasília. */
export function formatTimeBR(value: DateInput, fallback = '—'): string {
  const inst = toInstant(value);
  return inst ? timeFormatter.format(inst) : fallback;
}

/** Alias explícito de formatDateTimeBR — deixa clara a conversão para Brasília. */
export const formatTimestampInBrasilia = formatDateTimeBR;

/** Tempo relativo aproximado ("hoje", "ontem", "há 3 dias"). Base: Brasília. */
export function formatRelativeDateBR(value: DateInput, fallback = '—'): string {
  const inst = toInstant(value);
  if (!inst) return fallback;
  const nowDays = brasiliaDayNumber(new Date());
  const thenDays = brasiliaDayNumber(inst);
  const diff = thenDays - nowDays;
  if (Math.abs(diff) <= 30) return relativeTimeFormatter.format(diff, 'day');
  return formatDateBR(inst, fallback);
}

/** Número serial do dia civil (em Brasília) de um instante — para diffs em dias. */
function brasiliaDayNumber(instant: Date): number {
  const iso = dateOnlyInBrasilia(instant);
  const civil = parseDateOnly(iso);
  return civil ? Math.floor(civil.getTime() / 86_400_000) : 0;
}

/** Data civil ("YYYY-MM-DD") de um instante convertido para Brasília. */
export function dateOnlyInBrasilia(value: DateInput): string {
  const inst = toInstant(value);
  if (!inst) return '';
  // en-CA => "YYYY-MM-DD"; timeZone garante o dia correto em Brasília.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(inst);
}

// ── "AGORA" em Brasília ───────────────────────────────────────────────────────

/** Data atual ("YYYY-MM-DD") no fuso de Brasília — não depende do fuso do navegador. */
export function getCurrentDateInBrasilia(): string {
  return dateOnlyInBrasilia(new Date());
}

/** Competência atual ("YYYY-MM") no fuso de Brasília. */
export function getCurrentCompetenciaInBrasilia(): string {
  return getCurrentDateInBrasilia().slice(0, 7);
}

/** Data e hora atual formatada ("14/07/2026, 13:45") no fuso de Brasília. */
export function getCurrentDateTimeInBrasilia(): string {
  return dateTimeFormatter.format(new Date());
}
