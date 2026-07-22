import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatPercentBR } from '@/lib/formatters';
import type { CriterionState } from '../types/rewards-report.types';

const TONE: Record<CriterionState['tone'], string> = {
  ok: 'bg-success/10 text-success',
  atencao: 'bg-status-warning/10 text-status-warning',
  impacto: 'bg-destructive/10 text-destructive',
  neutro: 'bg-muted/50 text-muted-foreground',
};

/** Célula de critério com heatmap suave + rótulo textual (não depende só de cor). */
export function RewardCriterionCell({ state }: { state: CriterionState }) {
  const text = state.kind === 'valor' && state.value != null ? formatPercentBR(state.value * 100, 1) : state.label;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className={cn('inline-flex min-w-[52px] justify-center rounded-md px-2 py-0.5 text-xs font-medium tabular-nums', TONE[state.tone])}>{text}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px]">{state.tooltip}</TooltipContent>
    </Tooltip>
  );
}
