import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const variants: Record<StatusVariant, string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-status-warning/10 text-status-warning',
  danger: 'bg-destructive/10 text-destructive',
  info: 'bg-primary/10 text-primary',
  neutral: 'bg-muted text-muted-foreground',
};

interface StatusBadgeProps {
  variant?: StatusVariant;
  children: ReactNode;
  /** Mostra o ponto colorido à esquerda (padrão true) */
  dot?: boolean;
  className?: string;
}

/**
 * Badge de status padronizado para telas internas. Só apresentação.
 * (Distinto do ui/status-badge legado, que renderiza só um ponto.)
 */
export function StatusBadge({ variant = 'neutral', children, dot = true, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}
