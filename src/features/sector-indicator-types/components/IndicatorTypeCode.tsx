import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/** Badge do código técnico (identificador interno). */
export function IndicatorTypeCode({ codigo }: { codigo: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center rounded-md border border-border/70 bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold tracking-wide text-foreground">{codigo}</span>
      </TooltipTrigger>
      <TooltipContent>Identificador utilizado internamente pela aplicação.</TooltipContent>
    </Tooltip>
  );
}
