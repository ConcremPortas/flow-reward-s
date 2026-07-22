import { Lock } from 'lucide-react';
import { StatusBadge } from '@/components/app/StatusBadge';
import { SALARY_POSITION_LABEL } from '../domain/employeeSalaryPosition';
import type { SalaryPosition } from '../types/job-employee.types';

const VARIANT: Record<SalaryPosition, 'success' | 'warning' | 'danger' | 'neutral'> = {
  dentro: 'success', abaixo: 'warning', acima: 'danger', sem_faixa: 'neutral', sem_salario: 'neutral', restrito: 'neutral',
};

/** Posição salarial frente à faixa do cargo. "restrito" nunca revela valores. */
export function EmployeeSalaryPosition({ posicao }: { posicao: SalaryPosition }) {
  if (posicao === 'restrito') {
    return <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> Acesso restrito</span>;
  }
  return <StatusBadge variant={VARIANT[posicao]}>{SALARY_POSITION_LABEL[posicao]}</StatusBadge>;
}
