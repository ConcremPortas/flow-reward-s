import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
  title?: string;
  description?: string;
  /** Ações no cabeçalho (à direita) */
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Remove o padding interno do corpo (ex.: para tabelas full-bleed) */
  noBodyPadding?: boolean;
}

/**
 * Card de seção/conteúdo para telas internas (cabeçalho opcional + corpo). Só apresentação.
 */
export function SectionCard({
  title, description, actions, children, className, noBodyPadding,
}: SectionCardProps) {
  const hasHeader = title || description || actions;
  return (
    <div className={cn('rounded-xl border border-border/70 bg-card shadow-[var(--shadow-card)]', className)}>
      {hasHeader && (
        <div className="flex items-start justify-between gap-4 border-b border-border/60 px-5 py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-foreground">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn(!noBodyPadding && 'p-5')}>{children}</div>
    </div>
  );
}
