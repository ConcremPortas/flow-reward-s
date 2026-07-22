// Pendências de EPI — puro.
import type { EPI } from '@/hooks/useEPI';
import { inCompetencia } from './dates';

export interface EpiResumo {
  abertas: number;    // não conformidades registradas na competência
}

export function epiResumo(
  epi: EPI[],
  comp: string,
  funcIds?: Set<string>,
): EpiResumo {
  const abertas = epi.filter(e =>
    e.status === 'nao_conforme' &&
    inCompetencia(e.data_entrega, comp) &&
    (!funcIds || (e.funcionario_id != null && funcIds.has(e.funcionario_id))),
  ).length;
  return { abertas };
}
