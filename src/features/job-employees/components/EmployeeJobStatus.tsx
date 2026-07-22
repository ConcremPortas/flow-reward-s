import { StatusBadge } from '@/components/app/StatusBadge';
import { SITUACAO_LABEL, SITUACAO_TOM } from '../domain/employeeJobStatus';
import type { EmployeeJobSituacao } from '../types/job-employee.types';

const TOM_TO_VARIANT = { success: 'success', warning: 'warning', danger: 'danger', info: 'info', neutral: 'neutral' } as const;

/** Badge da situação de enquadramento derivada (não persistida). */
export function EmployeeJobStatus({ situacao }: { situacao: EmployeeJobSituacao }) {
  return <StatusBadge variant={TOM_TO_VARIANT[SITUACAO_TOM[situacao]]}>{SITUACAO_LABEL[situacao]}</StatusBadge>;
}
