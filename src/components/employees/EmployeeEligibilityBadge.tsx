import { StatusBadge, type StatusVariant } from '@/components/app/StatusBadge';
import { ELIGIBILITY_LABEL } from '@/features/employees/domain/employeeEligibility';
import type { EligibilityStatus } from '@/features/employees/types';

const TONE: Record<EligibilityStatus, StatusVariant> = {
  elegivel: 'success',
  pendente: 'warning',
  nao_elegivel: 'danger',
  fora_premiacao: 'neutral',
};

export function EmployeeEligibilityBadge({ status }: { status: EligibilityStatus }) {
  return <StatusBadge variant={TONE[status]}>{ELIGIBILITY_LABEL[status]}</StatusBadge>;
}
