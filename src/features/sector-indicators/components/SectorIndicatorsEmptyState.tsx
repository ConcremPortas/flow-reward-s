import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/app/EmptyState';

/** Estado vazio da feature — fino wrapper do EmptyState padrão. */
export function SectorIndicatorsEmptyState(props: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return <EmptyState {...props} />;
}
