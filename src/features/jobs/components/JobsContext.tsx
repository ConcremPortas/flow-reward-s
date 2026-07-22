import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';
import type { JobsContextMetrics } from '../domain/jobDataQuality';
import type { JobFilters } from '../types/job.types';

interface Props {
  ctx: JobsContextMetrics;
  onQuickFilter?: (patch: Partial<JobFilters>) => void;
}

/** Faixa de contexto compacta com métricas reais (cada tile pode aplicar um filtro rápido). */
export function JobsContext({ ctx, onQuickFilter }: Props) {
  const tiles: Array<{ label: string; value: number; tone?: 'warn' | 'danger'; filter?: Partial<JobFilters> }> = [
    { label: 'Cargos', value: ctx.total, filter: { status: 'todos' } },
    { label: 'Ativos', value: ctx.ativos, filter: { status: 'ativos' } },
    { label: 'Ocupados', value: ctx.ocupados, filter: { ocupacao: 'ocupados' } },
    { label: 'Sem ocupantes', value: ctx.semOcupantes, tone: ctx.semOcupantes > 0 ? 'warn' : undefined, filter: { ocupacao: 'sem_ocupantes' } },
    { label: 'Sem nível', value: ctx.semNivel, tone: ctx.semNivel > 0 ? 'warn' : undefined },
    { label: 'Sem faixa', value: ctx.semFaixa, tone: ctx.semFaixa > 0 ? 'warn' : undefined, filter: { faixa: 'sem_faixa' } },
    { label: 'Para revisar', value: ctx.paraRevisar, tone: ctx.paraRevisar > 0 ? 'danger' : undefined, filter: { situacao: 'incompleta' } },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {tiles.map((t) => {
        const clickable = !!(onQuickFilter && t.filter);
        return (
          <button
            key={t.label}
            type="button"
            disabled={!clickable}
            onClick={clickable ? () => onQuickFilter!(t.filter!) : undefined}
            className={cn(
              'rounded-xl border bg-card p-3 text-left shadow-[var(--shadow-card)] transition-colors',
              clickable && 'hover:border-primary/30 hover:bg-muted/40',
              t.tone === 'danger' ? 'border-destructive/30' : t.tone === 'warn' ? 'border-status-warning/30' : 'border-border/70',
            )}
          >
            <p className={cn('text-xl font-bold tabular-nums leading-none', t.tone === 'danger' ? 'text-destructive' : t.tone === 'warn' ? 'text-status-warning' : 'text-foreground')}>
              {formatNumberBR(t.value)}
            </p>
            <p className="mt-1.5 text-xs font-medium text-muted-foreground">{t.label}</p>
          </button>
        );
      })}
    </div>
  );
}
