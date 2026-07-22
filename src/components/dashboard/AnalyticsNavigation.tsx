import { cn } from '@/lib/utils';
import { VIEWS, viewIndex, type ViewKey } from '@/features/dashboard/views';

interface AnalyticsNavigationProps {
  active: ViewKey;
  onChange: (v: ViewKey) => void;
}

/** Barra horizontal das 5 visões. Ativa: verde institucional + branco. Teclado: ← →. */
export function AnalyticsNavigation({ active, onChange }: AnalyticsNavigationProps) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = viewIndex(active);
    if (e.key === 'ArrowRight' && i < VIEWS.length - 1) { e.preventDefault(); onChange(VIEWS[i + 1].key); }
    if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); onChange(VIEWS[i - 1].key); }
  };

  return (
    <nav role="tablist" aria-label="Visões do dashboard" onKeyDown={onKeyDown} className="flex gap-1.5 overflow-x-auto pb-0.5">
      {VIEWS.map((v) => {
        const isActive = v.key === active;
        const Icon = v.icon;
        return (
          <button
            key={v.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(v.key)}
            className={cn(
              'group inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
              isActive
                ? 'bg-[#08783e] text-white shadow-sm'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <span className={cn('text-[11px] font-semibold tabular-nums', isActive ? 'text-white/70' : 'text-muted-foreground/60')}>{v.num}</span>
            <Icon className="h-4 w-4" />
            <span className="whitespace-nowrap">{v.short}</span>
          </button>
        );
      })}
    </nav>
  );
}
