// Filtros e faixa de contexto dos locais de DSS — puros.
import { normalizeStr } from './dssLocationPresentation';
import type { DssLocationFilters, DssLocationRow } from '../types/dss-location.types';

export function matchesDssLocationFilters(row: DssLocationRow, f: DssLocationFilters): boolean {
  if (f.search && !normalizeStr(`${row.nome} ${row.descricao ?? ''}`).includes(normalizeStr(f.search))) return false;
  if (f.utilizacao === 'com_funcionarios' && row.usage.funcionarios === 0) return false;
  if (f.utilizacao === 'sem_funcionarios' && row.usage.funcionarios > 0) return false;
  if (f.utilizacao === 'com_historico' && !row.usage.temHistorico) return false;
  if (f.utilizacao === 'sem_historico' && row.usage.temHistorico) return false;
  if (f.situacao !== 'todos' && row.status.status !== f.situacao) return false;
  return true;
}

export function countActiveDssLocationFilters(f: DssLocationFilters): number {
  return [f.utilizacao !== 'todos', f.situacao !== 'todos'].filter(Boolean).length;
}

export interface DssLocationContext {
  locais: number;
  funcionariosVinculados: number;
  funcionariosSemLocal: number;
  dssRealizados: number;
  ultimaData: string | null;
}

export function computeDssLocationContext(rows: DssLocationRow[], funcionariosSemLocal: number): DssLocationContext {
  let ultima: string | null = null;
  for (const r of rows) {
    if (r.usage.ultimaData && (!ultima || r.usage.ultimaData > ultima)) ultima = r.usage.ultimaData;
  }
  return {
    locais: rows.length,
    funcionariosVinculados: rows.reduce((s, r) => s + r.usage.funcionarios, 0),
    funcionariosSemLocal,
    dssRealizados: rows.reduce((s, r) => s + r.usage.dssRealizados, 0),
    ultimaData: ultima,
  };
}
