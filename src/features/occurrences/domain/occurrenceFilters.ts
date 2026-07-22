// Predicados de busca/filtro da grade de lançamento — funções puras.
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { OccurrenceDraftMap, OccurrenceFilters, OccurrenceRowKind } from '../types';
import { deriveRowStatus } from './occurrenceValidation';

const norm = (v: string) => v.toLowerCase();

export function matchesOccurrenceSearch(f: Funcionario, term: string): boolean {
  if (!term) return true;
  const t = norm(term);
  return (
    norm(f.nome).includes(t) ||
    norm(f.cpf || '').includes(t) ||
    norm(f.funcao?.nome || '').includes(t) ||
    norm(f.setor?.nome || '').includes(t)
  );
}

interface MatchContext {
  baseline: OccurrenceDraftMap;
  draft: OccurrenceDraftMap;
}

export function matchesOccurrenceFilters(f: Funcionario, filters: OccurrenceFilters, ctx: MatchContext): boolean {
  if (!matchesOccurrenceSearch(f, filters.search)) return false;
  if (filters.setorId !== 'todos') {
    if (filters.setorId === '__sem_setor__') { if (f.setor_id) return false; }
    else if (f.setor_id !== filters.setorId) return false;
  }
  if (filters.categoriaId !== 'todos' && f.categoria_id !== filters.categoriaId) return false;
  if (filters.status !== 'todos' && (f.status || 'Ativo') !== filters.status) return false;

  const status = deriveRowStatus({ baseline: ctx.baseline[f.id], current: ctx.draft[f.id] });
  const cur = ctx.draft[f.id] ?? { faltas: 0, advertencias: 0 };

  if (filters.tipo === 'falta' && cur.faltas <= 0) return false;
  if (filters.tipo === 'advertencia' && cur.advertencias <= 0) return false;
  if (filters.somenteComOcorrencia && cur.faltas <= 0 && cur.advertencias <= 0) return false;
  if (filters.somenteAlterados && status !== 'alterado') return false;
  if (filters.ocultarZerados && cur.faltas <= 0 && cur.advertencias <= 0) return false;

  return true;
}

export function occurrenceRowStatusOf(id: string, ctx: MatchContext): OccurrenceRowKind {
  return deriveRowStatus({ baseline: ctx.baseline[id], current: ctx.draft[id] });
}
