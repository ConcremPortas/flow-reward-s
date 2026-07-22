import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/** Badge do código técnico do indicador geral. */
export function GeneralIndicatorTypeCode({ codigo }: { codigo: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center rounded-md border border-border/70 bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold tracking-wide text-foreground">{codigo}</span>
      </TooltipTrigger>
      <TooltipContent>Código utilizado internamente para identificar este indicador geral.</TooltipContent>
    </Tooltip>
  );
}
