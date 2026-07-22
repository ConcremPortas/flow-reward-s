import { useMemo } from 'react';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { BasePremiacao } from '@/hooks/useBasePremiacao';
import { computeTotals } from '../domain/rewardsReportMetrics';
import { groupByBase, groupBySetor } from '../domain/rewardsReportGrouping';
import { buildFunnel, criterionImpacts, largestDifferences } from '../domain/rewardsReconciliation';

/** Agregações da Conciliação (memoizadas). */
export function useRewardsReconciliation(rows: ResultadoPremiacao[], bases: BasePremiacao[]) {
  return useMemo(() => {
    const totals = computeTotals(rows);
    return {
      totals,
      funnel: buildFunnel(totals),
      impactos: criterionImpacts(rows),
      maioresDiferencas: largestDifferences(rows, 15),
      porSetor: groupBySetor(rows),
      porBase: groupByBase(rows, bases),
    };
  }, [rows, bases]);
}
