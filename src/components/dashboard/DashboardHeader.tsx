import { BarChart3 } from 'lucide-react';
import type { ReactNode } from 'react';
import { competenciaLabelLong } from '@/features/dashboard/utils/dates';
import { formatDateTimeBR } from '@/lib/dateTime';

interface DashboardHeaderProps {
  competencia: string;
  lastUpdated: Date | null;
  actions?: ReactNode;   // topo-direita: modo, atualizar, exportar
  children?: ReactNode;  // barra de filtros (linha inferior)
}

/** Cabeçalho compacto (≈130px): título/contexto + ações no topo, filtros embaixo. */
export function DashboardHeader({ competencia, lastUpdated, actions, children }: DashboardHeaderProps) {
  const updated = lastUpdated ? formatDateTimeBR(lastUpdated) : '—';

  return (
    <div className="rounded-2xl border border-border/70 bg-card px-5 py-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3">
        {/* Linha superior */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight text-foreground">Central Analítica de RH</h1>
              <p className="text-xs text-muted-foreground">
                {competencia ? `${competenciaLabelLong(competencia)} · ` : ''}atualizado {updated}
              </p>
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>

        {/* Linha inferior — filtros */}
        {children && <div className="border-t border-border/60 pt-3">{children}</div>}
      </div>
    </div>
  );
}
