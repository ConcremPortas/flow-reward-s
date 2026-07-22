import { StatusBadge } from '@/components/app/StatusBadge';

export function UserStatus({ ativo }: { ativo: boolean }) {
  return <StatusBadge variant={ativo ? 'success' : 'neutral'}>{ativo ? 'Ativo' : 'Inativo'}</StatusBadge>;
}
