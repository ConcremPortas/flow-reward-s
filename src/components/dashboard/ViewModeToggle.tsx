import { LayoutDashboard, LineChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ViewMode } from '@/features/dashboard/types';

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (m: ViewMode) => void;
}

/** Alternador Executivo / Analítico. */
export function ViewModeToggle({ value, onChange }: ViewModeToggleProps) {
  const opts: { key: ViewMode; label: string; icon: typeof LineChart }[] = [
    { key: 'executivo', label: 'Executivo', icon: LayoutDashboard },
    { key: 'analitico', label: 'Analítico', icon: LineChart },
  ];
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
      {opts.map(o => {
        const Icon = o.icon;
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" />
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
