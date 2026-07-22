import type { Cargo } from '@/hooks/useCargos';
import type { JobSituacao } from '../types/job.types';

export interface SituacaoResultado {
  situacao: JobSituacao;
  lacunas: JobSituacao[];
}

const temFaixaCompleta = (c: Cargo): boolean =>
  typeof c.salario_minimo === 'number' && typeof c.salario_maximo === 'number';

const temNivel = (c: Cargo): boolean =>
  c.nivel_hierarquico != null && String(c.nivel_hierarquico).trim() !== '';

/**
 * Deriva a situação cadastral do cargo. Função pura, sem persistência. Um cargo
 * pode ter várias lacunas — `lacunas` lista todas; `situacao` é a prioritária:
 *  - 2+ lacunas estruturais (setor/nível/faixa) → configuracao_incompleta
 *  - 1 lacuna estrutural → a lacuna específica
 *  - ocupantes fora da faixa (calculável) → revisar_enquadramento
 *  - sem ocupantes → sem_ocupantes
 *  - nada disso → regular
 */
export function derivarSituacao(
  cargo: Cargo,
  ocupantes: number,
  ocupantesForaDaFaixa: number | null,
): SituacaoResultado {
  const lacunas: JobSituacao[] = [];
  if (!cargo.setor_id) lacunas.push('sem_setor');
  if (!temNivel(cargo)) lacunas.push('sem_nivel');
  if (!temFaixaCompleta(cargo)) lacunas.push('sem_faixa');

  const estruturais = lacunas.length;

  if (ocupantes === 0) lacunas.push('sem_ocupantes');
  if (ocupantesForaDaFaixa != null && ocupantesForaDaFaixa > 0) lacunas.push('revisar_enquadramento');

  let situacao: JobSituacao;
  if (estruturais >= 2) situacao = 'configuracao_incompleta';
  else if (estruturais === 1) situacao = lacunas[0];
  else if (ocupantesForaDaFaixa != null && ocupantesForaDaFaixa > 0) situacao = 'revisar_enquadramento';
  else if (ocupantes === 0) situacao = 'sem_ocupantes';
  else situacao = 'regular';

  return { situacao, lacunas };
}

export const SITUACAO_LABEL: Record<JobSituacao, string> = {
  regular: 'Regular',
  sem_nivel: 'Sem nível',
  sem_faixa: 'Sem faixa',
  sem_setor: 'Sem setor',
  sem_ocupantes: 'Sem ocupantes',
  revisar_enquadramento: 'Revisar enquadramento',
  configuracao_incompleta: 'Configuração incompleta',
};

export type SituacaoTom = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const SITUACAO_TOM: Record<JobSituacao, SituacaoTom> = {
  regular: 'success',
  sem_nivel: 'warning',
  sem_faixa: 'warning',
  sem_setor: 'warning',
  sem_ocupantes: 'neutral',
  revisar_enquadramento: 'danger',
  configuracao_incompleta: 'danger',
};
