import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';
import type { Indicator, Tone } from './masterShared';

const TONE: Record<Tone, string> = {
  default: 'text-primary',
  success: 'text-success',
  warning: 'text-status-warning',
  danger: 'text-destructive',
  info: 'text-primary',
  neutral: 'text-muted-foreground',
};

/** Indicadores contextuais compactos da aba ativa. */
export function MasterDataStats({ indicators, loading }: { indicators: Indicator[]; loading: boolean }) {
  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {indicators.map((c) => {
          const Icon = c.icon;
          return (
            <Tooltip key={c.key}>
              <TooltipTrigger asChild>
                <div className="rounded-xl border border-border/70 bg-card p-3.5 text-left shadow-[var(--shadow-card)]" tabIndex={0} aria-label={`${c.label}: ${formatNumberBR(c.value)}`}>
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60', TONE[c.tone])}><Icon className="h-4 w-4" /></span>
                  <div className="mt-2">
                    {loading ? <Skeleton className="h-6 w-12" /> : <p className={cn('text-xl font-bold leading-none tabular-nums', TONE[c.tone])}>{formatNumberBR(c.value)}</p>}
                    <p className="mt-1 text-xs font-medium text-foreground">{c.label}</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>{c.hint}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
