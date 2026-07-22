// Helpers de competência ('YYYY-MM') — funções puras.
import { getCurrentCompetenciaInBrasilia, formatMonthYearBR } from '@/lib/dateTime';

const MESES_ABREV = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/**
 * Competência do mês corrente ('YYYY-MM'), no fuso de Brasília — não depende do
 * fuso do navegador (um usuário em outro país continua vendo o mês de Brasília).
 */
export function currentCompetencia(): string {
  return getCurrentCompetenciaInBrasilia();
}

/** Desloca a competência em N meses (negativo = passado). */
export function shiftCompetencia(comp: string, months: number): string {
  const [y, m] = comp.split('-').map(Number);
  if (!y || !m) return comp;
  const base = new Date(y, m - 1 + months, 1);
  const ny = base.getFullYear();
  const nm = String(base.getMonth() + 1).padStart(2, '0');
  return `${ny}-${nm}`;
}

/** Rótulo curto de competência: 'jul/25'. */
export function competenciaLabel(comp: string): string {
  const [y, m] = comp.split('-').map(Number);
  if (!y || !m) return comp;
  return `${MESES_ABREV[m - 1]}/${String(y).slice(2)}`;
}

/** Rótulo longo: 'julho de 2026' (padrão pt-BR centralizado). */
export function competenciaLabelLong(comp: string): string {
  return formatMonthYearBR(comp, comp);
}

/** Último dia da competência ('YYYY-MM-DD'). */
export function endOfCompetencia(comp: string): string {
  const [y, m] = comp.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${comp}-${String(last).padStart(2, '0')}`;
}

const iso = (d?: string | null): string => (d ? d.slice(0, 10) : '');

/** A data (string ISO) cai dentro da competência? */
export function inCompetencia(dateStr: string | null | undefined, comp: string): boolean {
  return iso(dateStr).slice(0, 7) === comp;
}

/** A data é <= último dia da competência? */
export function onOrBeforeEnd(dateStr: string | null | undefined, comp: string): boolean {
  const d = iso(dateStr);
  return !!d && d <= endOfCompetencia(comp);
}

/** A data é > último dia da competência (ou ausente = ainda vigente)? */
export function afterEndOrAbsent(dateStr: string | null | undefined, comp: string): boolean {
  const d = iso(dateStr);
  return !d || d > endOfCompetencia(comp);
}

/** Lista de N competências terminando em `comp` (mais antiga → mais recente). */
export function lastCompetencias(comp: string, count: number): string[] {
  const out: string[] = [];
  for (let i = count - 1; i >= 0; i--) out.push(shiftCompetencia(comp, -i));
  return out;
}
