import { ArrowUpRight, ArrowDownRight, Minus, HelpCircle } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, YAxis } from 'recharts';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ExecutiveMetric, MetricStatus } from '@/features/dashboard/types';
import { fmtMetric, fmtDelta } from '@/features/dashboard/utils/format';

const STATUS_ACCENT: Record<MetricStatus, string> = {
  critical: 'bg-destructive',
  warning: 'bg-status-warning',
  positive: 'bg-success',
  info: 'bg-primary',
  neutral: 'bg-muted-foreground/40',
};

const STATUS_STROKE: Record<MetricStatus, string> = {
  critical: 'hsl(var(--destructive))',
  warning: 'hsl(var(--status-warning))',
  positive: 'hsl(var(--success))',
  info: 'hsl(var(--primary))',
  neutral: 'hsl(var(--muted-foreground))',
};

interface MetricTrendCardProps {
  metric: ExecutiveMetric;
  onClick?: (key: string) => void;
}

export function MetricTrendCard({ metric, onClick }: MetricTrendCardProps) {
  const { status, delta, betterWhen, trend, format } = metric;
  const isGood = delta == null || delta === 0 ? null : betterWhen === 'up' ? delta > 0 : delta < 0;
  const deltaColor = isGood == null ? 'text-muted-foreground' : isGood ? 'text-success' : 'text-destructive';
  const DeltaIcon = delta == null || delta === 0 ? Minus : delta > 0 ? ArrowUpRight : ArrowDownRight;

  const trendData = trend.map((v, i) => ({ i, v }));
  const interactive = !!onClick;

  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? () => onClick!(metric.key) : undefined}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick!(metric.key); } : undefined}
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl border border-border/70 bg-card p-5 text-left shadow-[var(--shadow-card)]',
        interactive && 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--shadow-hover)]',
      )}
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', STATUS_ACCENT[status])} />

      <div className="flex items-center justify-between gap-2 pl-1">
        <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-muted-foreground/60 hover:text-muted-foreground" aria-label="Como é calculado">
              <HelpCircle className="h-3.5 w-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs leading-relaxed">{metric.tooltip}</TooltipContent>
        </Tooltip>
      </div>

      <p className="mt-2 truncate pl-1 text-[1.7rem] font-bold leading-none tracking-tight text-foreground">
        {metric.value == null ? '—' : fmtMetric(metric.value, format)}
      </p>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-1">
        <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium', deltaColor)}>
          <DeltaIcon className="h-3.5 w-3.5" />
          {metric.delta == null ? '—' : fmtDelta(metric.delta, format)}
        </span>
        <span className="text-xs text-muted-foreground">vs. período anterior</span>
      </div>

      {metric.target != null && (
        <p className="mt-1 pl-1 text-xs text-muted-foreground">
          Meta de referência: {metric.targetKind === 'max' ? '≤' : '≥'} {fmtMetric(metric.target, format)}
        </p>
      )}

      {trendData.length > 1 && (
        <div className="mt-auto h-12 w-full pt-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <Line
                type="monotone"
                dataKey="v"
                stroke={STATUS_STROKE[status]}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
