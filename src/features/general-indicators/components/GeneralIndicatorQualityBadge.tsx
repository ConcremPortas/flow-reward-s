import { AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { DataQualitySignal } from '../types/general-indicators.types';

/**
 * Indicação SEPARADA de qualidade do dado ("Possível inconsistência"). Nunca
 * substitui o status de negócio. Só aparece quando há sinal relevante.
 */
export function GeneralIndicatorQualityBadge({ signals }: { signals: DataQualitySignal[] }) {
  const warnings = signals.filter((s) => s.severity === 'warning');
  if (warnings.length === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 rounded-full bg-status-warning/10 px-2 py-0.5 text-xs font-medium text-status-warning">
          <AlertTriangle className="h-3 w-3" /> Possível inconsistência
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[260px]">
        <ul className="space-y-1 text-xs">
          {warnings.map((w, i) => <li key={i}><span className="font-semibold">{w.title}.</span> {w.message}</li>)}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}
