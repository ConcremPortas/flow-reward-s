import { cn } from '@/lib/utils';
import type { RewardBaseTab } from '../types/reward-base.types';

interface Props { tab: RewardBaseTab; onChange: (t: RewardBaseTab) => void; counts: Record<RewardBaseTab, number> }

const TABS: { key: RewardBaseTab; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'em_uso', label: 'Em uso' },
  { key: 'sem_vinculo', label: 'Sem vínculo' },
  { key: 'revisar', label: 'Revisar' },
];

export function RewardBasesTabs({ tab, onChange, counts }: Props) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border/70 bg-muted/30 p-0.5">
      {TABS.map(t => (
        <button key={t.key} type="button" onClick={() => onChange(t.key)}
          className={cn('rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
            tab === t.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
          {t.label} <span className="ml-1 text-xs text-muted-foreground">{counts[t.key]}</span>
        </button>
      ))}
    </div>
  );
}
