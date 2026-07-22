import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MetricStatus } from '@/features/dashboard/types';

const DOT: Record<MetricStatus, string> = {
  positive: 'bg-success', warning: 'bg-status-warning', critical: 'bg-destructive', info: 'bg-primary', neutral: 'bg-muted-foreground',
};

interface StatCardProps {
  title: string;
  value: string;
  hint?: string;
  status?: MetricStatus;
  icon?: LucideIcon;
  onClick?: () => void;
}

/** KPI compacto (sem sparkline) para as páginas 2/3/5. Mesma altura no grid. */
export function StatCard({ title, value, hint, status, icon: Icon, onClick }: StatCardProps) {
  const interactive = !!onClick;
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={interactive ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick!(); } : undefined}
      className={cn(
        'flex h-full flex-col justify-between rounded-xl border border-border/70 bg-card p-4 shadow-[var(--shadow-card)]',
        interactive && 'cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--shadow-hover)]',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[13px] font-medium text-muted-foreground">{title}</p>
        {Icon ? <Icon className="h-4 w-4 text-muted-foreground/60" /> : status && <span className={cn('h-2 w-2 rounded-full', DOT[status])} />}
      </div>
      <p className="mt-2 truncate text-[1.7rem] font-bold leading-none tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
