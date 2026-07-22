import { StatusBadge } from '@/components/app/StatusBadge';
import { FUNCTION_STATUS_META } from '../domain/functionRegistrationStatus';
import type { FunctionRegistrationStatus as Status } from '../types/function.types';

export function FunctionRegistrationStatus({ status }: { status: Status }) {
  const meta = FUNCTION_STATUS_META[status.status];
  return <StatusBadge variant={meta.variant}>{meta.label}</StatusBadge>;
}
