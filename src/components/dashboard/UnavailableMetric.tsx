import { HelpCircle, Ban } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface UnavailableMetricProps {
  title: string;
  reason: string;
}

/**
 * Card de métrica sem fonte de dados. Deixa explícito que o dado é
 * indisponível (nunca um número fictício) e documenta a origem necessária.
 */
export function UnavailableMetric({ title, reason }: UnavailableMetricProps) {
  return (
    <div className="flex flex-col rounded-xl border border-dashed border-border bg-muted/20 p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" aria-label="Por que indisponível" className="text-muted-foreground/70 hover:text-muted-foreground">
              <HelpCircle className="h-4 w-4" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs text-xs leading-relaxed">{reason}</TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-3 flex items-center gap-2 text-muted-foreground">
        <Ban className="h-4 w-4" />
        <span className="text-sm font-medium">Dado indisponível</span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground/80">Sem fonte de dados no banco</p>
    </div>
  );
}
