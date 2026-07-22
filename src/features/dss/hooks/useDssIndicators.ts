import { useMemo, useState } from 'react';
import type { DSS } from '@/hooks/useDSS';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { currentCompetencia, shiftCompetencia, inCompetencia } from '@/features/dashboard/utils/dates';
import { percentVariation } from '../domain/dssComparison';
import {
  buildDssMonthlyEvolution, computeLowParticipation, computeTemaDistribution,
  computeLocaisAbaixoReferencia, participacaoPorLocal, dssParticipacaoMedia,
} from '../domain/dssCalculations';

export function useDssIndicators(dssRecords: DSS[], funcionarios: Funcionario[]) {
  const [competencia, setCompetencia] = useState(currentCompetencia());
  const anterior = shiftCompetencia(competencia, -1);

  return useMemo(() => {
    const doMes = dssRecords.filter((d) => inCompetencia(d.data_realizacao, competencia));
    const doMesAnterior = dssRecords.filter((d) => inCompetencia(d.data_realizacao, anterior));

    const participacaoMedia = dssParticipacaoMedia(dssRecords, funcionarios, competencia);
    const participacaoMediaAnterior = dssParticipacaoMedia(dssRecords, funcionarios, anterior);

    const totalParticipacoes = doMes.reduce((a, d) => a + (d.participantes_ids || []).length, 0);
    const totalParticipacoesAnterior = doMesAnterior.reduce((a, d) => a + (d.participantes_ids || []).length, 0);

    const baixaParticipacao = computeLowParticipation(dssRecords, funcionarios).filter((r) => r.taxa < 70);
    const locaisAbaixo = computeLocaisAbaixoReferencia(dssRecords, funcionarios, competencia, 90);

    return {
      competencia, setCompetencia,
      dssRealizados: doMes.length,
      participacaoMedia,
      pessoasAbaixoMeta: baixaParticipacao.length,
      locaisAbaixoReferencia: locaisAbaixo.length,
      totalParticipacoes,
      variacaoParticipacoes: percentVariation(totalParticipacoes, totalParticipacoesAnterior),
      variacaoParticipacaoMedia: participacaoMedia != null && participacaoMediaAnterior != null
        ? percentVariation(participacaoMedia, participacaoMediaAnterior) : null,
      evolucao12Meses: buildDssMonthlyEvolution(dssRecords, funcionarios, competencia, 12),
      participacaoPorLocalMap: participacaoPorLocal(dssRecords, funcionarios, competencia),
      locaisAbaixoLista: locaisAbaixo,
      baixaParticipacaoLista: baixaParticipacao,
      distribuicaoTemas: computeTemaDistribution(doMes),
    };
  }, [dssRecords, funcionarios, competencia, anterior]);
}

export type UseDssIndicatorsReturn = ReturnType<typeof useDssIndicators>;
