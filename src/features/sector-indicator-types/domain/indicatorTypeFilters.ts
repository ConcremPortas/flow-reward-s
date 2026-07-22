// Filtros e resumo da gestão de tipos de indicadores setoriais — puros.
import { normalizeNome, normalizeCodigo } from './indicatorTypeValidation';
import type { IndicatorTypeFilters, IndicatorTypeRow } from '../types/indicator-type.types';

function haystack(row: IndicatorTypeRow): string {
  return `${normalizeCodigo(row.codigo)} ${normalizeNome(row.nome)} ${normalizeNome(row.descricao)}`;
}

export function matchesIndicatorTypeFilters(row: IndicatorTypeRow, f: IndicatorTypeFilters): boolean {
  if (f.search) {
    const term = f.search.trim();
    if (!haystack(row).includes(normalizeNome(term)) && !normalizeCodigo(row.codigo).includes(normalizeCodigo(term))) return false;
  }
  if (f.utilizacao === 'em_uso' && row.usage.medicoes === 0) return false;
  if (f.utilizacao === 'sem_medicao' && row.usage.medicoes > 0) return false;
  if (f.situacao !== 'todos' && row.status.status !== f.situacao) return false;
  return true;
}

export function countActiveIndicatorTypeFilters(f: IndicatorTypeFilters): number {
  return [f.utilizacao !== 'todos', f.situacao !== 'todos'].filter(Boolean).length;
}

export interface IndicatorTypeSummaryCounts {
  total: number;
  emUso: number;
  semMedicao: number;
  aRevisar: number;
}

export function computeIndicatorTypeSummary(rows: IndicatorTypeRow[]): IndicatorTypeSummaryCounts {
  return {
    total: rows.length,
    emUso: rows.filter(r => r.usage.medicoes > 0).length,
    semMedicao: rows.filter(r => r.usage.medicoes === 0).length,
    aRevisar: rows.filter(r => r.status.status === 'revisar' || r.status.status === 'config_incompleta').length,
  };
}
