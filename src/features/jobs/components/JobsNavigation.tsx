import { List, Network } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JOBS_VIEWS, JOBS_VIEW_LABEL } from '../views';
import type { JobsView } from '../types/job.types';

const ICON: Record<JobsView, LucideIcon> = { lista: List, estrutura: Network };

interface Props { active: JobsView; onChange: (v: JobsView) => void }

export function JobsNavigation({ active, onChange }: Props) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = JOBS_VIEWS.indexOf(active);
    if (e.key === 'ArrowRight' && i < JOBS_VIEWS.length - 1) { e.preventDefault(); onChange(JOBS_VIEWS[i + 1]); }
    if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); onChange(JOBS_VIEWS[i - 1]); }
  };
  return (
    <nav role="tablist" aria-label="Visões de cargos" onKeyDown={onKeyDown} className="flex gap-1.5 overflow-x-auto pb-0.5">
      {JOBS_VIEWS.map((v) => {
        const isActive = v === active;
        const Icon = ICON[v];
        return (
          <button
            key={v} type="button" role="tab" aria-selected={isActive} tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(v)}
            className={cn('inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
              isActive ? 'bg-[#08783e] text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
          >
            <Icon className="h-4 w-4" /> {JOBS_VIEW_LABEL[v]}
          </button>
        );
      })}
    </nav>
  );
}
