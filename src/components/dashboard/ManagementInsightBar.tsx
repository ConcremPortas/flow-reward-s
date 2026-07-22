import { useNavigate } from 'react-router-dom';
import { AlertOctagon, AlertTriangle, CheckCircle2, Info, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Insight, MetricStatus } from '@/features/dashboard/types';

const META: Record<MetricStatus, { icon: typeof Info; tint: string }> = {
  critical: { icon: AlertOctagon, tint: 'text-destructive bg-destructive/10' },
  warning: { icon: AlertTriangle, tint: 'text-status-warning bg-status-warning/10' },
  positive: { icon: CheckCircle2, tint: 'text-success bg-success/10' },
  info: { icon: Info, tint: 'text-primary bg-primary/10' },
  neutral: { icon: Info, tint: 'text-muted-foreground bg-muted' },
};

interface ManagementInsightBarProps {
  insights: Insight[];
}

/** Faixa horizontal de leitura gerencial — até 4 insights, superfície verde clara. */
export function ManagementInsightBar({ insights }: ManagementInsightBarProps) {
  const navigate = useNavigate();
  const top = insights.slice(0, 4);

  return (
    <div className="rounded-2xl border border-primary/10 bg-primary/[0.05] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-[15px] font-semibold tracking-tight text-foreground">Leitura Gerencial do Período</h2>
      </div>
      {top.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum ponto de atenção relevante no período com os filtros atuais.</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {top.map((ins) => {
            const m = META[ins.severity];
            const Icon = m.icon;
            return (
              <div key={ins.id} className="flex flex-col rounded-xl border border-border/60 bg-card p-3.5">
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', m.tint)}>
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <p className="mt-2.5 text-[13px] font-semibold leading-snug text-foreground">{ins.title}</p>
                <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{ins.detail}</p>
                {ins.module && (
                  <button
                    type="button"
                    onClick={() => navigate(ins.module!)}
                    className="mt-2.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                  >
                    Aprofundar <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
