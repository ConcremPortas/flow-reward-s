import { cn } from '@/lib/utils';
import { formatNumberBR, formatPercentBR } from '@/lib/formatters';
import type { EmployeeContextMetrics } from '../domain/employeeJobModel';
import type { JobEmployeeFilters } from '../types/job-employee.types';

interface Props {
  ctx: EmployeeContextMetrics;
  onQuickFilter?: (patch: Partial<JobEmployeeFilters>) => void;
}

/** Faixa de contexto compacta com métricas reais de enquadramento. */
export function JobEmployeesContext({ ctx, onQuickFilter }: Props) {
  const tiles: Array<{ label: string; value: string; tone?: 'warn'; filter?: Partial<JobEmployeeFilters> }> = [
    { label: 'Colaboradores ativos', value: formatNumberBR(ctx.totalAtivos), filter: { status: 'ativos' } },
    { label: 'Cobertura de enquadramento', value: formatPercentBR(ctx.coberturaEnquadramento, 0) },
    { label: 'Enquadrados', value: formatNumberBR(ctx.enquadrados), filter: { enquadramento: 'enquadrados' } },
    { label: 'Sem cargo', value: formatNumberBR(ctx.semCargo), tone: ctx.semCargo > 0 ? 'warn' : undefined, filter: { enquadramento: 'sem_cargo' } },
    { label: 'Pendências', value: formatNumberBR(ctx.pendentes), tone: ctx.pendentes > 0 ? 'warn' : undefined, filter: { enquadramento: 'pendentes' } },
    { label: 'Funções distintas', value: formatNumberBR(ctx.funcoesDistintas) },
    { label: 'Setores', value: formatNumberBR(ctx.setoresDistintos) },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {tiles.map((t) => {
        const clickable = !!(onQuickFilter && t.filter);
        return (
          <button
            key={t.label} type="button" disabled={!clickable}
            onClick={clickable ? () => onQuickFilter!(t.filter!) : undefined}
            className={cn('rounded-xl border bg-card p-3 text-left shadow-[var(--shadow-card)] transition-colors',
              clickable && 'hover:border-primary/30 hover:bg-muted/40',
              t.tone === 'warn' ? 'border-status-warning/30' : 'border-border/70')}
          >
            <p className={cn('text-lg font-bold leading-none tabular-nums', t.tone === 'warn' ? 'text-status-warning' : 'text-foreground')}>{t.value}</p>
            <p className="mt-1.5 text-xs font-medium text-muted-foreground">{t.label}</p>
          </button>
        );
      })}
    </div>
  );
}
