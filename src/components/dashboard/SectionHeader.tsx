import type { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

/** Cabeçalho de seção fora de card (título + descrição + ações). */
export function SectionHeader({ title, description, actions }: SectionHeaderProps) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h2>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
