import { StatusBadge } from '@/components/app/StatusBadge';
import { COMPANY_STATUS_META } from '../domain/companyRegistrationStatus';
import type { CompanyRegistrationStatus as Status } from '../types/company.types';

export function CompanyRegistrationStatus({ status }: { status: Status }) {
  const meta = COMPANY_STATUS_META[status.status];
  return <StatusBadge variant={meta.variant}>{meta.label}</StatusBadge>;
}
