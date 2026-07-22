// Filtros e faixa de contexto da gestão de indicadores gerais — puros.
import { normalizeNome, normalizeCodigo } from './generalIndicatorTypeValidation';
import type { GeneralIndicatorTypeFilters, GeneralIndicatorTypeRow } from '../types/general-indicator-type.types';

function haystack(row: GeneralIndicatorTypeRow): string {
  return `${normalizeCodigo(row.codigo)} ${normalizeNome(row.nome)} ${normalizeNome(row.descricao)}`;
}

export function matchesGeneralIndicatorTypeFilters(row: GeneralIndicatorTypeRow, f: GeneralIndicatorTypeFilters): boolean {
  if (f.search) {
    const term = f.search.trim();
    if (!haystack(row).includes(normalizeNome(term)) && !normalizeCodigo(row.codigo).includes(normalizeCodigo(term))) return false;
  }
  if (f.status === 'ativo' && !row.ativo) return false;
  if (f.status === 'inativo' && row.ativo) return false;
  if (f.utilizacao === 'com_medicao' && row.usage.medicoes === 0) return false;
  if (f.utilizacao === 'sem_medicao' && row.usage.medicoes > 0) return false;
  if (f.situacao !== 'todos' && row.status.status !== f.situacao) return false;
  return true;
}

export function countActiveGeneralIndicatorTypeFilters(f: GeneralIndicatorTypeFilters): number {
  return [f.status !== 'todos', f.utilizacao !== 'todos', f.situacao !== 'todos'].filter(Boolean).length;
}

export interface GeneralIndicatorTypeContext {
  total: number;
  ativos: number;
  comMedicoes: number;
  totalMedicoes: number;
  ultimaCompetencia: string | null; // mais recente entre todos os tipos
}

export function computeGeneralIndicatorTypeContext(rows: GeneralIndicatorTypeRow[]): GeneralIndicatorTypeContext {
  let ultima: string | null = null;
  for (const r of rows) {
    if (r.usage.ultimaCompetencia && (!ultima || r.usage.ultimaCompetencia > ultima)) ultima = r.usage.ultimaCompetencia;
  }
  return {
    total: rows.length,
    ativos: rows.filter(r => r.ativo).length,
    comMedicoes: rows.filter(r => r.usage.medicoes > 0).length,
    totalMedicoes: rows.reduce((s, r) => s + r.usage.medicoes, 0),
    ultimaCompetencia: ultima,
  };
}
