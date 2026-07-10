import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: ReactNode;
  description?: string;
  icon?: LucideIcon;
  /** Texto de tendência (ex.: "+12% vs mês anterior") */
  trend?: string;
  /** false pinta a tendência em vermelho; padrão verde/sucesso */
  trendPositive?: boolean;
  className?: string;
}

/**
 * Card de KPI para dashboards internos. Só apresentação.
 */
export function MetricCard({
  title, value, description, icon: Icon, trend, trendPositive = true, className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'group rounded-xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--shadow-hover)]',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {Icon && (
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/[0.08] text-primary transition-colors group-hover:bg-primary/[0.14]">
            <Icon className="h-[18px] w-[18px]" />
          </div>
        )}
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">{value}</p>
      {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      {trend && (
        <p className={cn('mt-2 text-xs font-medium', trendPositive ? 'text-success' : 'text-destructive')}>
          {trend}
        </p>
      )}
    </div>
  );
}
