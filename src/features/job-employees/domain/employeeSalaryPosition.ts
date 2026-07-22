import type { Cargo } from '@/hooks/useCargos';
import type { SalaryPosition } from '../types/job-employee.types';

/**
 * Posição do salário do colaborador frente à faixa do cargo estruturado.
 * Guardada por autorização — sem permissão retorna 'restrito' (nunca o valor).
 * Salário ausente NUNCA é tratado como zero.
 */
export function calcularPosicaoSalarial(
  cargo: Cargo | null,
  salario: number | null,
  autorizado: boolean,
): SalaryPosition {
  if (!autorizado) return 'restrito';
  if (salario == null || !Number.isFinite(salario)) return 'sem_salario';
  if (!cargo || typeof cargo.salario_minimo !== 'number' || typeof cargo.salario_maximo !== 'number') return 'sem_faixa';
  if (salario < cargo.salario_minimo) return 'abaixo';
  if (salario > cargo.salario_maximo) return 'acima';
  return 'dentro';
}

export const SALARY_POSITION_LABEL: Record<SalaryPosition, string> = {
  abaixo: 'Abaixo da faixa',
  dentro: 'Dentro da faixa',
  acima: 'Acima da faixa',
  sem_faixa: 'Cargo sem faixa',
  sem_salario: 'Salário não informado',
  restrito: 'Acesso restrito',
};
