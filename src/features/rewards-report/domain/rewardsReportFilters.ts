// Filtros do relatório — puros. Globais (competência/base/categoria/setor/busca)
// + avançados (faixa/situação/critérios impactados/diferença).
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import { valorFinal, diferenca } from './rewardsReportMetrics';

export interface ReportFilters {
  competencia: string;   // 'YYYY-MM' | ''
  baseId: string;        // 'todos' | id
  categoria: string;     // 'todos' | nome
  setor: string;         // 'todos' | nome
  faixa: string;         // 'todos' | nome
  search: string;
  situacao: 'todos' | 'com_bonus' | 'sem_bonus';
  somenteComDiferenca: boolean;
  criterios: Partial<Record<'producao' | 'epi' | 'faltas' | 'advertencias' | 'dss' | 'indicadores', boolean>>;
}

export const DEFAULT_REPORT_FILTERS: ReportFilters = {
  competencia: '', baseId: 'todos', categoria: 'todos', setor: 'todos', faixa: 'todos',
  search: '', situacao: 'todos', somenteComDiferenca: false, criterios: {},
};

const impacted = (v: number | null | undefined) => v != null && v < 1;

export function matchesReportFilters(r: ResultadoPremiacao, f: ReportFilters): boolean {
  if (f.competencia && r.mes_competencia !== `${f.competencia}-01`) return false;
  if (f.baseId !== 'todos' && (r.base_premiacao_id ?? '') !== f.baseId) return false;
  if (f.categoria !== 'todos' && !(r.categoria ?? '').toUpperCase().includes(f.categoria.toUpperCase())) return false;
  if (f.setor !== 'todos' && (r.setor ?? '') !== f.setor) return false;
  if (f.faixa !== 'todos' && (r.faixa ?? '') !== f.faixa) return false;
  if (f.search) {
    const s = f.search.toLowerCase();
    if (!((r.nome ?? '').toLowerCase().includes(s) || (r.cod_funcionario ?? '').toLowerCase().includes(s) || (r.setor ?? '').toLowerCase().includes(s))) return false;
  }
  if (f.situacao === 'com_bonus' && valorFinal(r) <= 0) return false;
  if (f.situacao === 'sem_bonus' && valorFinal(r) > 0) return false;
  if (f.somenteComDiferenca && diferenca(r) === 0) return false;

  const c = f.criterios;
  if (c.producao && !impacted(r.nota_producao)) return false;
  if (c.epi && !impacted(r.nota_epi)) return false;
  if (c.faltas && !impacted(r.nota_faltas)) return false;
  if (c.advertencias && !impacted(r.nota_advertencias)) return false;
  if (c.dss && !impacted(r.nota_dss)) return false;
  if (c.indicadores && !(impacted(r.nota_faturamento) || impacted(r.nota_itens_nc) || impacted(r.nota_tratamento_nc) || impacted(r.nota_hora_maquina) || impacted(r.nota_operacao_segura) || impacted(r.nota_limpeza))) return false;

  return true;
}

/** Aplica somente os filtros GLOBAIS (competência/base/categoria/setor/busca). */
export function matchesGlobal(r: ResultadoPremiacao, f: Pick<ReportFilters, 'competencia' | 'baseId' | 'categoria' | 'setor' | 'search'>): boolean {
  if (f.competencia && r.mes_competencia !== `${f.competencia}-01`) return false;
  if (f.baseId !== 'todos' && (r.base_premiacao_id ?? '') !== f.baseId) return false;
  if (f.categoria !== 'todos' && !(r.categoria ?? '').toUpperCase().includes(f.categoria.toUpperCase())) return false;
  if (f.setor !== 'todos' && (r.setor ?? '') !== f.setor) return false;
  if (f.search) {
    const s = f.search.toLowerCase();
    if (!((r.nome ?? '').toLowerCase().includes(s) || (r.cod_funcionario ?? '').toLowerCase().includes(s) || (r.setor ?? '').toLowerCase().includes(s))) return false;
  }
  return true;
}

export function countActiveReportFilters(f: ReportFilters): number {
  return [
    f.baseId !== 'todos', f.categoria !== 'todos', f.setor !== 'todos', f.faixa !== 'todos',
    f.situacao !== 'todos', f.somenteComDiferenca, Object.values(f.criterios).some(Boolean),
  ].filter(Boolean).length;
}

export function distinctSetores(rows: ResultadoPremiacao[]): string[] {
  return [...new Set(rows.map(r => r.setor).filter(Boolean) as string[])].sort();
}
export function distinctFaixas(rows: ResultadoPremiacao[]): string[] {
  return [...new Set(rows.map(r => r.faixa).filter(Boolean) as string[])].sort();
}
