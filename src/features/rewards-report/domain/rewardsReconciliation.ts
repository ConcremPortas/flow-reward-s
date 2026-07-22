// Conciliação financeira — funil, impacto por critério (operacional) e maiores
// diferenças. Puro. NÃO decompõe a diferença em R$ por critério (não é
// rastreável no resultado do motor) — o impacto por critério é OPERACIONAL.
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { CriterionImpact, DifferenceRow, FinancialTotals, FunnelStep } from '../types/rewards-report.types';
import { valorFinal, diferenca } from './rewardsReportMetrics';
import { CRITERION_DEFS, classifyCriterion } from './rewardsCriterionState';

/** Etapas reais do funil Possível → Alcançado → (ajustes) → Final. */
export function buildFunnel(totals: FinancialTotals): FunnelStep[] {
  const steps: FunnelStep[] = [
    { key: 'possivel', label: 'Bônus possível', value: totals.possivel, kind: 'base' },
    { key: 'perda', label: 'Perda de potencial', value: totals.alcancado - totals.possivel, kind: 'delta' },
    { key: 'alcancado', label: 'Bônus alcançado', value: totals.alcancado, kind: 'resultado' },
  ];
  if (totals.temAjustes) {
    steps.push({ key: 'ajustes', label: 'Ajustes manuais', value: totals.ajustes, kind: 'delta' });
  }
  steps.push({ key: 'final', label: 'Valor final', value: totals.final, kind: 'resultado' });
  return steps;
}

/** Impacto OPERACIONAL por critério (resultados com nota < 1). */
export function criterionImpacts(rows: ResultadoPremiacao[]): CriterionImpact[] {
  return CRITERION_DEFS.map(def => {
    const funcs = new Set<string>();
    const setores = new Set<string>();
    const notas: number[] = [];
    let impactados = 0;
    for (const r of rows) {
      const st = classifyCriterion(r, def);
      if (st.kind !== 'valor' || st.value == null) continue;
      notas.push(st.value);
      if (st.value < 1) {
        impactados += 1;
        if (r.funcionario_id) funcs.add(r.funcionario_id);
        if (r.setor) setores.add(r.setor);
      }
    }
    return {
      key: def.key,
      label: def.label,
      resultadosImpactados: impactados,
      funcionariosUnicos: funcs.size,
      setores: setores.size,
      notaMedia: notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null,
    };
  }).filter(c => c.notaMedia != null)
    .sort((a, b) => b.resultadosImpactados - a.resultadosImpactados);
}

/** Maiores diferenças individuais (mais negativas primeiro). */
export function largestDifferences(rows: ResultadoPremiacao[], limit = 10): DifferenceRow[] {
  return rows
    .map((r): DifferenceRow => ({ id: r.id, nome: r.nome ?? '—', setor: r.setor ?? '—', possivel: r.bonus_possivel || 0, final: valorFinal(r), diferenca: diferenca(r) }))
    .filter(d => d.diferenca !== 0)
    .sort((a, b) => a.diferenca - b.diferenca)
    .slice(0, limit);
}

export interface FaixaDistribution { faixa: string; count: number; pct: number; total: number }

/** Distribuição por faixa real + "Sem premiação" separado. */
export function distributionByFaixa(rows: ResultadoPremiacao[]): FaixaDistribution[] {
  const map = new Map<string, { count: number; total: number }>();
  for (const r of rows) {
    const vf = valorFinal(r);
    const key = vf <= 0 ? 'Sem premiação' : (r.faixa || 'Sem faixa');
    const cur = map.get(key) ?? { count: 0, total: 0 };
    cur.count += 1; cur.total += vf;
    map.set(key, cur);
  }
  const total = rows.length || 1;
  return [...map.entries()]
    .map(([faixa, v]) => ({ faixa, count: v.count, pct: (v.count / total) * 100, total: v.total }))
    .sort((a, b) => (a.faixa === 'Sem premiação' ? 1 : b.faixa === 'Sem premiação' ? -1 : b.count - a.count));
}
