import { TrendingUp, TrendingDown, AlertTriangle, Info, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GeneralInsight } from '../types/general-indicators.types';

interface Props {
  insights: GeneralInsight[];
  onSelectIndicator: (tipoId: string) => void;
}

const TYPE_META = {
  positivo: { icon: TrendingUp, cls: 'text-success bg-success/10' },
  negativo: { icon: TrendingDown, cls: 'text-destructive bg-destructive/10' },
  atencao: { icon: AlertTriangle, cls: 'text-status-warning bg-status-warning/10' },
  informativo: { icon: Info, cls: 'text-primary bg-primary/10' },
} as const;

/** Leitura gerencial do período — insights determinísticos, clicáveis. */
export function GeneralIndicatorsInsights({ insights, onSelectIndicator }: Props) {
  if (insights.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">Sem apontamentos relevantes nesta competência.</p>;
  }

  return (
    <ul className="space-y-2">
      {insights.map((ins, i) => {
        const meta = TYPE_META[ins.type];
        const Icon = meta.icon;
        return (
          <li key={`${ins.indicatorCode}-${ins.code}-${i}`}>
            <button
              type="button"
              onClick={() => onSelectIndicator(ins.actionTipoId)}
              className="group flex w-full items-start gap-3 rounded-xl border border-border/60 p-3 text-left transition-colors hover:bg-muted/40"
            >
              <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', meta.cls)}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-foreground">{ins.title}</span>
                <span className="block text-xs text-muted-foreground">{ins.message}</span>
              </span>
              <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
