import { TrendingUp, TrendingDown, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReportInsight } from '../types/rewards-report.types';

const META = {
  positivo: { icon: TrendingUp, cls: 'text-success bg-success/10' },
  negativo: { icon: TrendingDown, cls: 'text-destructive bg-destructive/10' },
  atencao: { icon: AlertTriangle, cls: 'text-status-warning bg-status-warning/10' },
  informativo: { icon: Info, cls: 'text-primary bg-primary/10' },
} as const;

/** Leitura gerencial — insights determinísticos. */
export function RewardsManagementInsights({ insights }: { insights: ReportInsight[] }) {
  if (insights.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">Sem apontamentos para o filtro atual.</p>;
  return (
    <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
      {insights.map((ins, i) => {
        const meta = META[ins.type]; const Icon = meta.icon;
        return (
          <div key={`${ins.code}-${i}`} className="flex items-start gap-3 rounded-xl border border-border/60 p-3">
            <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', meta.cls)}><Icon className="h-4 w-4" /></span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{ins.title}</p>
              <p className="text-xs text-muted-foreground">{ins.message}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
