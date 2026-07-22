import { LayoutDashboard, Network, Wallet, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JOBS_SALARIES_VIEWS, VIEW_LABEL } from '../views';
import type { JobsSalariesView } from '../types/jobsSalaries.types';

const ICON: Record<JobsSalariesView, LucideIcon> = {
  resumo: LayoutDashboard,
  estrutura: Network,
  remuneracao: Wallet,
  governanca: ShieldCheck,
};

interface Props {
  active: JobsSalariesView;
  onChange: (v: JobsSalariesView) => void;
}

export function JobsSalariesNavigation({ active, onChange }: Props) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = JOBS_SALARIES_VIEWS.indexOf(active);
    if (e.key === 'ArrowRight' && i < JOBS_SALARIES_VIEWS.length - 1) { e.preventDefault(); onChange(JOBS_SALARIES_VIEWS[i + 1]); }
    if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); onChange(JOBS_SALARIES_VIEWS[i - 1]); }
  };
  return (
    <nav role="tablist" aria-label="Visões de cargos e remuneração" onKeyDown={onKeyDown} className="flex gap-1.5 overflow-x-auto pb-0.5">
      {JOBS_SALARIES_VIEWS.map((v) => {
        const isActive = v === active;
        const Icon = ICON[v];
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(v)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
              isActive ? 'bg-[#08783e] text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" /> {VIEW_LABEL[v]}
          </button>
        );
      })}
    </nav>
  );
}
