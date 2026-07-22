import { useNavigate } from 'react-router-dom';
import { AlertOctagon, AlertTriangle, CheckCircle2, Info, ArrowRight, Sparkles } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { cn } from '@/lib/utils';
import type { Insight, MetricStatus } from '@/features/dashboard/types';

const SEV_META: Record<MetricStatus, { icon: typeof Info; tint: string; label: string }> = {
  critical: { icon: AlertOctagon, tint: 'bg-destructive/10 text-destructive', label: 'Crítico' },
  warning: { icon: AlertTriangle, tint: 'bg-status-warning/10 text-status-warning', label: 'Atenção' },
  positive: { icon: CheckCircle2, tint: 'bg-success/10 text-success', label: 'Positivo' },
  info: { icon: Info, tint: 'bg-primary/10 text-primary', label: 'Informativo' },
  neutral: { icon: Info, tint: 'bg-muted text-muted-foreground', label: 'Info' },
};

interface ManagementInsightsProps {
  insights: Insight[];
}

/** Leitura Gerencial: frases automáticas do período, ordenadas por severidade. */
export function ManagementInsights({ insights }: ManagementInsightsProps) {
  const navigate = useNavigate();

  return (
    <SectionCard
      title="Leitura Gerencial do Período"
      description="Destaques automáticos a partir dos dados, ordenados por severidade"
    >
      {insights.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/[0.05] p-4">
          <Sparkles className="h-5 w-5 text-success" />
          <p className="text-sm text-muted-foreground">
            Nenhum ponto de atenção relevante no período com os filtros atuais.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {insights.map((ins) => {
            const meta = SEV_META[ins.severity];
            const Icon = meta.icon;
            return (
              <div
                key={ins.id}
                className="flex items-start gap-3 rounded-lg border border-border/70 p-3.5 transition-colors hover:bg-muted/40"
              >
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', meta.tint)}>
                  <Icon className="h-[18px] w-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{ins.title}</p>
                    <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide', meta.tint)}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{ins.detail}</p>
                  {ins.module && (
                    <button
                      type="button"
                      onClick={() => navigate(ins.module!)}
                      className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      Abrir módulo
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
