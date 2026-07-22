// Evolução do quadro (headcount, admissões, desligamentos, turnover) — puro.
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { WorkforcePoint } from '../types';
import { competenciaLabel, endOfCompetencia, inCompetencia, lastCompetencias, onOrBeforeEnd, afterEndOrAbsent } from './dates';

/** Headcount ativo ao fim de uma competência (baseado em datas registradas). */
function ativosAoFim(funcs: Funcionario[], comp: string): number {
  return funcs.filter(f =>
    f.data_admissao &&
    onOrBeforeEnd(f.data_admissao, comp) &&
    afterEndOrAbsent(f.data_demissao, comp),
  ).length;
}

/**
 * Série de N meses (default 12) terminando em `comp`.
 * turnover = desligamentos ÷ headcount médio do mês × 100.
 */
export function computeWorkforceEvolution(
  funcs: Funcionario[],
  comp: string,
  months = 12,
): WorkforcePoint[] {
  const comps = lastCompetencias(comp, months);
  return comps.map((c, idx) => {
    const ativos = ativosAoFim(funcs, c);
    const prevAtivos = idx === 0 ? ativos : ativosAoFim(funcs, comps[idx - 1]);
    const admissoes = funcs.filter(f => inCompetencia(f.data_admissao, c)).length;
    const desligamentos = funcs.filter(f => inCompetencia(f.data_demissao, c)).length;
    const headcountMedio = (prevAtivos + ativos) / 2 || 1;
    const turnover = (desligamentos / headcountMedio) * 100;
    return {
      competencia: c,
      label: competenciaLabel(c),
      ativos,
      admissoes,
      desligamentos,
      saldo: admissoes - desligamentos,
      turnover: Number(turnover.toFixed(2)),
    };
  });
}

/** Headcount ativo "hoje" no conjunto (flag ativo), independente de datas. */
export function headcountAtivo(funcs: Funcionario[]): number {
  return funcs.filter(f => f.ativo).length;
}

export { endOfCompetencia };
