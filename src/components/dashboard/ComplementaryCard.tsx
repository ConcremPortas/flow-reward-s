import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MetricStatus } from '@/features/dashboard/types';

const DOT: Record<MetricStatus, string> = {
  positive: 'bg-success', warning: 'bg-status-warning', critical: 'bg-destructive', info: 'bg-primary', neutral: 'bg-muted-foreground',
};

export interface Conclusion { label: string; tone?: MetricStatus; }

interface ComplementaryCardProps {
  icon: LucideIcon;
  title: string;
  mainValue: string;
  mainLabel: string;
  status?: MetricStatus;
  children?: ReactNode;        // gráfico / barras
  conclusions: Conclusion[];
  onOpen: () => void;
  openLabel?: string;
}

/** Card de análise complementar: indicador + visual + conclusões + link. */
export function ComplementaryCard({
  icon: Icon, title, mainValue, mainLabel, status = 'neutral', children, conclusions, onOpen, openLabel = 'Ver análise completa',
}: ComplementaryCardProps) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-[30px] font-bold leading-none tracking-tight text-foreground">{mainValue}</span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <span className={cn('h-1.5 w-1.5 rounded-full', DOT[status])} /> {mainLabel}
        </span>
      </div>

      {children && <div className="mt-4">{children}</div>}

      {conclusions.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {conclusions.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className={cn('mt-1 h-1.5 w-1.5 shrink-0 rounded-full', DOT[c.tone ?? 'neutral'])} />
              <span>{c.label}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onOpen}
        className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-medium text-primary hover:underline"
      >
        {openLabel} <ArrowRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
