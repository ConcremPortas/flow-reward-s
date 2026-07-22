import { Shield } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  children?: ReactNode; // navegação
}

/** Cabeçalho global compacto — sem hero grande. */
export function DssHeader({ children }: Props) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card px-5 py-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight text-foreground">Gestão de DSS</h1>
            <p className="text-xs text-muted-foreground">Diálogo Semanal de Segurança — registro, histórico e indicadores</p>
          </div>
        </div>
        {children && <div className="border-t border-border/60 pt-3">{children}</div>}
      </div>
    </div>
  );
}
