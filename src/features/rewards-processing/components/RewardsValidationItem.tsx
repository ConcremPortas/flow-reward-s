import { CheckCircle2, AlertTriangle, XCircle, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ValidationItem } from '../types/rewards-processing.types';

const META = {
  pronto: { icon: CheckCircle2, cls: 'text-success bg-success/10' },
  atencao: { icon: AlertTriangle, cls: 'text-status-warning bg-status-warning/10' },
  bloqueio: { icon: XCircle, cls: 'text-destructive bg-destructive/10' },
} as const;

export function RewardsValidationItem({ item, onNavigate }: { item: ValidationItem; onNavigate: (to: string) => void }) {
  const meta = META[item.severity];
  const Icon = meta.icon;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 p-3">
      <span className={cn('mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', meta.cls)}><Icon className="h-4 w-4" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          {item.affectedCount != null && <span className="text-xs text-muted-foreground">· {item.affectedCount} afetado(s)</span>}
        </div>
        <p className="text-xs text-muted-foreground">{item.description}</p>
        {item.impact && <p className="mt-0.5 text-xs font-medium text-status-warning">{item.impact}</p>}
        <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground/70">{item.origin}</p>
      </div>
      {item.action && (
        <Button variant="ghost" size="sm" className="h-7 shrink-0 gap-1 text-xs" onClick={() => onNavigate(item.action!.to)}>
          {item.action.label} <ArrowUpRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
