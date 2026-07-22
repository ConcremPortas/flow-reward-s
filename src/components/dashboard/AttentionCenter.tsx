import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertOctagon, AlertTriangle, Info, ArrowRight, Check, ShieldCheck } from 'lucide-react';
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

interface AttentionCenterProps {
  items: AttentionItem[];
  className?: string;
}

/** Fila priorizada de situações. "Analisado" é marcação apenas de sessão (não persiste). */
export function AttentionCenter({ items, className }: AttentionCenterProps) {
  const navigate = useNavigate();
  const [done, setDone] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setDone(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  return (
    <SectionCard
      title="Central de Atenção"
      description="Situações priorizadas por severidade e impacto"
      className={className}
    >
      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/[0.05] p-4">
          <ShieldCheck className="h-5 w-5 text-success" />
          <p className="text-sm text-muted-foreground">Nenhuma situação prioritária no período.</p>
        </div>
      ) : (
        <div className="max-h-[420px] space-y-2 overflow-auto pr-1">
          {items.map(it => {
            const m = META[it.severity];
            const Icon = m.icon;
            const isDone = done.has(it.id);
            return (
              <div
                key={it.id}
                className={cn('flex items-start gap-3 rounded-lg border border-border/70 p-3 transition-colors', isDone && 'opacity-50')}
              >
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', m.tint)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={cn('text-sm font-semibold text-foreground', isDone && 'line-through')}>{it.situacao}</p>
                    {it.setor && <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">{it.setor}</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{it.impacto}{it.responsavel ? ` · resp. ${it.responsavel}` : ''}</p>
                  <div className="mt-1.5 flex items-center gap-3">
                    <button type="button" onClick={() => navigate(it.module)} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      Abrir módulo <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                    <button type="button" onClick={() => toggle(it.id)} className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                      <Check className="h-3.5 w-3.5" /> {isDone ? 'Reabrir' : 'Analisado'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}
