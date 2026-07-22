import { StatusBadge, type StatusVariant } from '@/components/app/StatusBadge';

const toneOf = (status?: string): StatusVariant => {
  const s = (status || 'Ativo').toLowerCase();
  if (s === 'ativo') return 'success';
  if (s === 'rescisão' || s === 'rescisao') return 'danger';
  if (s === 'férias' || s === 'ferias' || s === 'licença' || s === 'licenca') return 'warning';
  return 'neutral';
};

export function EmployeeStatusBadge({ status }: { status?: string }) {
  return <StatusBadge variant={toneOf(status)}>{status || 'Ativo'}</StatusBadge>;
}
