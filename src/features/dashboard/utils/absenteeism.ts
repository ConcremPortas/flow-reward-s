// Absenteísmo (faltas) — puro.
import type { FaltaAdvertencia } from '@/hooks/useFaltasAdvertencias';
import { inCompetencia } from './dates';

/** Total de faltas (soma de quantidade) na competência, opcionalmente restrito a um conjunto de funcionários. */
export function totalFaltas(
  registros: FaltaAdvertencia[],
  comp: string,
  funcionarioIds?: Set<string>,
): number {
  return registros
    .filter(r =>
      r.tipo === 'falta' &&
      inCompetencia(r.data_ocorrencia, comp) &&
      (!funcionarioIds || (r.funcionario_id != null && funcionarioIds.has(r.funcionario_id))),
    )
    .reduce((acc, r) => acc + (r.quantidade || 1), 0);
}

/** Total de advertências na competência. */
export function totalAdvertencias(
  registros: FaltaAdvertencia[],
  comp: string,
  funcionarioIds?: Set<string>,
): number {
  return registros
    .filter(r =>
      r.tipo === 'advertencia' &&
      inCompetencia(r.data_ocorrencia, comp) &&
      (!funcionarioIds || (r.funcionario_id != null && funcionarioIds.has(r.funcionario_id))),
    )
    .reduce((acc, r) => acc + (r.quantidade || 1), 0);
}

/** Índice de absenteísmo: faltas por 100 colaboradores no mês (aproximação). */
export function absenteismoIndex(faltas: number, headcount: number): number | null {
  if (headcount <= 0) return null;
  return Number(((faltas / headcount) * 100).toFixed(1));
}
