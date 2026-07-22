import { StatusBadge } from '@/components/app/StatusBadge';
import { UTILIZACAO_META } from '../domain/categoryUsage';
import type { CategoryUtilizacao } from '../types/category.types';

/** Badge do estado derivado de utilização (Em uso / Sem vínculo / Uso histórico). */
export function CategoryUsage({ utilizacao }: { utilizacao: CategoryUtilizacao }) {
  const meta = UTILIZACAO_META[utilizacao];
  return <StatusBadge variant={meta.variant}>{meta.label}</StatusBadge>;
}
