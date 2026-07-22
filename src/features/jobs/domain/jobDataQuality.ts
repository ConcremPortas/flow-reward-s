import type { JobRow } from '../types/job.types';

export interface JobsContextMetrics {
  total: number;
  ativos: number;
  ocupados: number;
  semOcupantes: number;
  semNivel: number;
  semFaixa: number;
  paraRevisar: number;
}

/**
 * Métricas da faixa de contexto — todas derivadas das linhas já enriquecidas
 * (sem consultas extras). "Para revisar" = cargos com situação de risco
 * (configuração incompleta ou enquadramento a revisar).
 */
export function calcularContexto(rows: JobRow[]): JobsContextMetrics {
  let ativos = 0;
  let ocupados = 0;
  let semOcupantes = 0;
  let semNivel = 0;
  let semFaixa = 0;
  let paraRevisar = 0;

  for (const r of rows) {
    if (r.cargo.ativo) ativos++;
    if (r.ocupantes > 0) ocupados++;
    else semOcupantes++;
    if (r.semNivel) semNivel++;
    if (!r.temFaixa) semFaixa++;
    if (r.situacao === 'configuracao_incompleta' || r.situacao === 'revisar_enquadramento') paraRevisar++;
  }

  return { total: rows.length, ativos, ocupados, semOcupantes, semNivel, semFaixa, paraRevisar };
}
