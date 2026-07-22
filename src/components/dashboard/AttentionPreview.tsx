import { useNavigate } from 'react-router-dom';
import { AlertOctagon, AlertTriangle, Info, ArrowRight, ShieldCheck } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { cn } from '@/lib/utils';
import type { AttentionItem, MetricStatus } from '@/features/dashboard/types';

const META: Record<MetricStatus, { icon: typeof Info; tint: string }> = {
  critical: { icon: AlertOctagon, tint: 'text-destructive bg-destructive/10' },
  warning: { icon: AlertTriangle, tint: 'text-status-warning bg-status-warning/10' },
  positive: { icon: ShieldCheck, tint: 'text-success bg-success/10' },
  info: { icon: Info, tint: 'text-primary bg-primary/10' },
  neutral: { icon: Info, tint: 'text-muted-foreground bg-muted' },
};

interface AttentionPreviewProps {
  items: AttentionItem[];
  onSeeAll: () => void;
  className?: string;
}

/** Prévia da Central de Atenção — 4 itens prioritários, sem scroll interno. */
export function AttentionPreview({ items, onSeeAll, className }: AttentionPreviewProps) {
  const top = items.slice(0, 4);
  const navigate = useNavigate();

  return (
    <SectionCard
      title="Central de Atenção"
      description="Situações priorizadas por severidade e impacto"
      className={cn('flex h-full flex-col', className)}
    >
      <div className="flex h-full flex-col">
        {top.length === 0 ? (
          <div className="flex flex-1 items-center gap-3 rounded-lg border border-success/20 bg-success/[0.05] p-4">
            <ShieldCheck className="h-5 w-5 text-success" />
            <p className="text-sm text-muted-foreground">Nenhuma situação prioritária no período.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {top.map((it) => {
              const m = META[it.severity];
              const Icon = m.icon;
              return (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => navigate(it.module)}
                  className="flex w-full items-start gap-3 rounded-lg border border-border/70 p-2.5 text-left transition-colors hover:bg-muted/40"
                >
                  <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', m.tint)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-semibold text-foreground">{it.situacao}</span>
                      {it.setor && <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{it.setor}</span>}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {it.impacto}{it.responsavel ? ` · ${it.responsavel}` : ''}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3 text-xs">
          <span className="text-muted-foreground">{items.length} situação(ões) identificada(s)</span>
          {items.length > 0 && (
            <button type="button" onClick={onSeeAll} className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              Ver todas <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
