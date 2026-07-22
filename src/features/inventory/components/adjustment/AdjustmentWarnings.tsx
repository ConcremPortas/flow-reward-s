import { Info, AlertTriangle, AlertOctagon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AjusteAviso } from '../../hooks/useStockAdjustment';

const ESTILO = {
  info: { cls: 'border-[hsl(217_90%_55%)]/30 bg-[hsl(217_90%_55%)]/5 text-[hsl(217_90%_35%)]', Icon: Info },
  warn: { cls: 'border-status-warning/30 bg-status-warning/5 text-status-warning', Icon: AlertTriangle },
  danger: { cls: 'border-destructive/30 bg-destructive/5 text-destructive', Icon: AlertOctagon },
} as const;

/** Avisos contextuais (informativos ou de atenção) — nunca bloqueiam além das regras da RPC. */
export function AdjustmentWarnings({ avisos }: { avisos: AjusteAviso[] }) {
  if (avisos.length === 0) return null;
  return (
    <div className="space-y-2" role="status" aria-live="polite">
      {avisos.map((a, i) => {
        const { cls, Icon } = ESTILO[a.tipo];
        return (
          <div key={i} className={cn('flex items-start gap-2 rounded-lg border px-3 py-2 text-sm', cls)}>
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="text-foreground/90">{a.texto}</span>
          </div>
        );
      })}
    </div>
  );
}
