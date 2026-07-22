import { Users, ClipboardList } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { JOB_EMPLOYEES_VIEWS, JOB_EMPLOYEES_VIEW_LABEL } from '../views';
import type { JobEmployeesView } from '../types/job-employee.types';

const ICON: Record<JobEmployeesView, LucideIcon> = { colaboradores: Users, pendencias: ClipboardList };

interface Props { active: JobEmployeesView; onChange: (v: JobEmployeesView) => void; pendencias?: number }

export function JobEmployeesNavigation({ active, onChange, pendencias }: Props) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = JOB_EMPLOYEES_VIEWS.indexOf(active);
    if (e.key === 'ArrowRight' && i < JOB_EMPLOYEES_VIEWS.length - 1) { e.preventDefault(); onChange(JOB_EMPLOYEES_VIEWS[i + 1]); }
    if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); onChange(JOB_EMPLOYEES_VIEWS[i - 1]); }
  };
  return (
    <nav role="tablist" aria-label="Visões de enquadramento" onKeyDown={onKeyDown} className="flex gap-1.5 overflow-x-auto pb-0.5">
      {JOB_EMPLOYEES_VIEWS.map((v) => {
        const isActive = v === active;
        const Icon = ICON[v];
        return (
          <button
            key={v} type="button" role="tab" aria-selected={isActive} tabIndex={isActive ? 0 : -1} onClick={() => onChange(v)}
            className={cn('inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors',
              isActive ? 'bg-[#08783e] text-white shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}
          >
            <Icon className="h-4 w-4" /> {JOB_EMPLOYEES_VIEW_LABEL[v]}
            {v === 'pendencias' && pendencias != null && pendencias > 0 && (
              <span className={cn('ml-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold', isActive ? 'bg-white/20' : 'bg-status-warning/15 text-status-warning')}>{pendencias}</span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
