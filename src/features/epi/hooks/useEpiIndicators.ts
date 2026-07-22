import { useMemo, useState } from 'react';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { currentCompetencia, shiftCompetencia, inCompetencia } from '@/features/dashboard/utils/dates';
import { percentVariation } from '../domain/epiComparison';
import { buildEpiMonthlyEvolution, buildSectorComparison, computeEpiInsights, type EpiAuditGroupEnriched } from '../domain/epiCalculations';
import { buildEmployeeTimelines, buildNonConformityRows, isReincidente } from '../domain/epiRecurrence';

export function useEpiIndicators(
  auditGroups: EpiAuditGroupEnriched[],
  funcionariosById: Map<string, Funcionario>,
  setores: { id: string; nome: string }[],
) {
  const [competencia, setCompetencia] = useState(currentCompetencia());
  const anterior = shiftCompetencia(competencia, -1);

  return useMemo(() => {
    const doMes = auditGroups.filter((g) => inCompetencia(g.data, competencia));
    const doMesAnterior = auditGroups.filter((g) => inCompetencia(g.data, anterior));

    const auditados = doMes.reduce((a, g) => a + g.totalAuditados, 0);
    const conformes = doMes.reduce((a, g) => a + g.conformes, 0);
    const naoConformes = doMes.reduce((a, g) => a + g.naoConformes, 0);
    const taxaConformidade = auditados > 0 ? Number(((conformes / auditados) * 100).toFixed(1)) : null;

    const auditadosAnterior = doMesAnterior.reduce((a, g) => a + g.totalAuditados, 0);
    const conformesAnterior = doMesAnterior.reduce((a, g) => a + g.conformes, 0);
    const taxaAnterior = auditadosAnterior > 0 ? (conformesAnterior / auditadosAnterior) * 100 : null;
    const variacaoTaxa = taxaConformidade != null && taxaAnterior != null ? percentVariation(taxaConformidade, taxaAnterior) : null;

    const timelines = buildEmployeeTimelines(auditGroups);
    const reincidentesGeral = timelines.filter((t) => isReincidente(t.events)).length;

    const comparacaoPorSetor = buildSectorComparison(auditGroups, funcionariosById, setores, competencia);
    const setoresAbaixoReferencia = comparacaoPorSetor.filter((s) => s.taxaConformidade != null && s.taxaConformidade < 90).length;

    const insights = computeEpiInsights({
      auditoriasRealizadas: doMes.length,
      taxaConformidade,
      variacaoTaxa,
      reincidentes: reincidentesGeral,
      setoresAbaixoReferencia,
    });

    return {
      competencia, setCompetencia,
      auditoriasRealizadas: doMes.length,
      auditados,
      conformes,
      naoConformes,
      taxaConformidade,
      variacaoTaxa,
      reincidentes: reincidentesGeral,
      setoresAbaixoReferencia,
      evolucao12Meses: buildEpiMonthlyEvolution(auditGroups, competencia, 12),
      comparacaoPorSetor,
      naoConformidadesLista: buildNonConformityRows(timelines, funcionariosById).slice(0, 15),
      insights,
    };
  }, [auditGroups, funcionariosById, setores, competencia, anterior]);
}

export type UseEpiIndicatorsReturn = ReturnType<typeof useEpiIndicators>;
