import { StatusBadge } from '@/components/app/StatusBadge';
import { perfilLabel } from '../domain/permissionDefinitions';

const VARIANT: Record<string, 'success' | 'info' | 'warning' | 'neutral'> = {
  admin: 'info', rh: 'neutral', sesmt: 'neutral', producao: 'neutral', custom: 'warning',
};

export function UserProfileBadge({ perfil }: { perfil: string }) {
  return <StatusBadge variant={VARIANT[perfil] ?? 'neutral'}>{perfilLabel(perfil)}</StatusBadge>;
}
