import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/app/EmptyState';

export function FunctionsEmptyState(props: { icon?: LucideIcon; title: string; description?: string; action?: ReactNode }) {
  return <EmptyState {...props} />;
}
