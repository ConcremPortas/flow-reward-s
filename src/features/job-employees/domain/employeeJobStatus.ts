import type { Cargo } from '@/hooks/useCargos';
import type { EmployeeJobSituacao, SalaryPosition } from '../types/job-employee.types';

const temNivel = (c: Cargo): boolean => c.nivel_hierarquico != null && String(c.nivel_hierarquico).trim() !== '';
const temFaixa = (c: Cargo): boolean => typeof c.salario_minimo === 'number' && typeof c.salario_maximo === 'number';

export interface EnquadramentoResultado {
  situacao: EmployeeJobSituacao;
  pendencias: EmployeeJobSituacao[];
}

/**
 * Deriva a situação de enquadramento do colaborador. Pura, sem persistência.
 * Função (RH) ≠ cargo (estrutura). Estados de salário só entram quando o
 * usuário está autorizado a ver remuneração. Ausência de salário nunca é zero.
 *
 * @param temFuncao colaborador possui função no cadastro RH
 * @param cargo cargo estruturado atual (via enquadramento) ou null
 * @param posicao posição salarial já calculada (respeitando autorização)
 */
export function derivarEnquadramento(
  temFuncao: boolean,
  cargo: Cargo | null,
  posicao: SalaryPosition,
): EnquadramentoResultado {
  const pendencias: EmployeeJobSituacao[] = [];

  if (!cargo) {
    // Sem cargo estruturado: distingue "somente função" de "sem cargo".
    const situacao: EmployeeJobSituacao = temFuncao ? 'somente_funcao' : 'sem_cargo';
    pendencias.push(situacao);
    return { situacao, pendencias };
  }

  if (!temNivel(cargo)) pendencias.push('sem_nivel');
  if (!temFaixa(cargo)) pendencias.push('sem_faixa');
  if (posicao === 'sem_salario') pendencias.push('salario_nao_informado');
  if (posicao === 'abaixo') pendencias.push('abaixo_faixa');
  if (posicao === 'acima') pendencias.push('acima_faixa');

  // Prioridade: problemas de faixa salarial > lacunas estruturais > regular.
  let situacao: EmployeeJobSituacao;
  if (posicao === 'abaixo') situacao = 'abaixo_faixa';
  else if (posicao === 'acima') situacao = 'acima_faixa';
  else if (!temNivel(cargo)) situacao = 'sem_nivel';
  else if (!temFaixa(cargo)) situacao = 'sem_faixa';
  else if (posicao === 'sem_salario') situacao = 'salario_nao_informado';
  else situacao = 'regular';

  return { situacao, pendencias };
}

export const SITUACAO_LABEL: Record<EmployeeJobSituacao, string> = {
  regular: 'Regular',
  sem_cargo: 'Sem cargo',
  somente_funcao: 'Somente função',
  sem_nivel: 'Sem nível',
  sem_faixa: 'Sem faixa',
  salario_nao_informado: 'Salário não informado',
  abaixo_faixa: 'Abaixo da faixa',
  acima_faixa: 'Acima da faixa',
  revisar: 'Revisar',
};

export type SituacaoTom = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const SITUACAO_TOM: Record<EmployeeJobSituacao, SituacaoTom> = {
  regular: 'success',
  sem_cargo: 'warning',
  somente_funcao: 'info',
  sem_nivel: 'warning',
  sem_faixa: 'warning',
  salario_nao_informado: 'neutral',
  abaixo_faixa: 'danger',
  acima_faixa: 'danger',
  revisar: 'warning',
};

/** Um enquadramento conta como "pendência" quando não é regular. */
export function isPendente(s: EmployeeJobSituacao): boolean {
  return s !== 'regular';
}
