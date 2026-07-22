// Agrupamentos do relatório (por base, por setor) — puros.
// Cada grupo reporta `funcionariosUnicos` além de `resultados` para não somar a
// mesma pessoa como se fossem várias.
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { BasePremiacao } from '@/hooks/useBasePremiacao';
import type { GroupRow } from '../types/rewards-report.types';
import { valorFinal } from './rewardsReportMetrics';

function aggregate(rows: ResultadoPremiacao[], keyOf: (r: ResultadoPremiacao) => string, labelOf: (key: string) => string): GroupRow[] {
  const map = new Map<string, { funcs: Set<string>; resultados: number; possivel: number; final: number }>();
  for (const r of rows) {
    const key = keyOf(r);
    const cur = map.get(key) ?? { funcs: new Set<string>(), resultados: 0, possivel: 0, final: 0 };
    cur.resultados += 1;
    cur.possivel += r.bonus_possivel || 0;
    cur.final += valorFinal(r);
    if (r.funcionario_id) cur.funcs.add(r.funcionario_id);
    map.set(key, cur);
  }
  return [...map.entries()].map(([key, v]): GroupRow => ({
    key,
    label: labelOf(key),
    resultados: v.resultados,
    funcionariosUnicos: v.funcs.size,
    possivel: v.possivel,
    final: v.final,
    diferenca: v.final - v.possivel,
    atingimento: v.possivel > 0 ? (v.final / v.possivel) * 100 : null,
  }));
}

export function groupByBase(rows: ResultadoPremiacao[], bases: BasePremiacao[]): GroupRow[] {
  const nome = new Map(bases.map(b => [b.id, b.nome]));
  return aggregate(rows, r => r.base_premiacao_id ?? '∅', key => key === '∅' ? 'Sem base' : (nome.get(key) ?? 'Base não encontrada'))
    .sort((a, b) => b.final - a.final);
}

export function groupBySetor(rows: ResultadoPremiacao[]): GroupRow[] {
  return aggregate(rows, r => r.setor || '∅', key => key === '∅' ? 'Sem setor' : key)
    .sort((a, b) => b.final - a.final);
}

export type GroupSort = 'valor' | 'diferenca' | 'atingimento' | 'quantidade';

export function sortGroups(groups: GroupRow[], sort: GroupSort): GroupRow[] {
  const arr = [...groups];
  switch (sort) {
    case 'diferenca': return arr.sort((a, b) => a.diferenca - b.diferenca); // mais negativo primeiro
    case 'atingimento': return arr.sort((a, b) => (a.atingimento ?? Infinity) - (b.atingimento ?? Infinity));
    case 'quantidade': return arr.sort((a, b) => b.resultados - a.resultados);
    case 'valor':
    default: return arr.sort((a, b) => b.final - a.final);
  }
}
