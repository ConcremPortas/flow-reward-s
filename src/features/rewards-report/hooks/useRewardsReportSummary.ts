import { useMemo } from 'react';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { BasePremiacao } from '@/hooks/useBasePremiacao';
import { computeTotals } from '../domain/rewardsReportMetrics';
import { groupByBase, groupBySetor } from '../domain/rewardsReportGrouping';
import { criterionImpacts, distributionByFaixa } from '../domain/rewardsReconciliation';
import { buildReportInsights } from '../domain/rewardsReportInsights';

/** Agregações do Resumo Executivo (memoizadas). */
export function useRewardsReportSummary(rows: ResultadoPremiacao[], bases: BasePremiacao[]) {
  return useMemo(() => {
    const totals = computeTotals(rows);
    const porBase = groupByBase(rows, bases);
    const porSetor = groupBySetor(rows);
    const impactos = criterionImpacts(rows);
    const distribuicao = distributionByFaixa(rows);
    const faixaMaisFrequente = distribuicao.filter(d => d.faixa !== 'Sem premiação').sort((a, b) => b.count - a.count)[0] ?? null;
    const insights = buildReportInsights({ totals, porSetor, porBase, impactos, faixaMaisFrequente });
    return { totals, porBase, porSetor, impactos, distribuicao, insights };
  }, [rows, bases]);
}
