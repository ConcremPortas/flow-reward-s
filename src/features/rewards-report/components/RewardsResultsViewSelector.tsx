import { cn } from '@/lib/utils';
import type { ResultView } from '../types/rewards-report.types';

const OPTS: { key: ResultView; label: string }[] = [
  { key: 'resultado', label: 'Resultado' },
  { key: 'criterios', label: 'Critérios' },
  { key: 'financeiro', label: 'Financeiro' },
];

export function RewardsResultsViewSelector({ value, onChange }: { value: ResultView; onChange: (v: ResultView) => void }) {
  return (
    <div className="inline-flex rounded-lg border border-border/70 bg-muted/30 p-0.5">
      {OPTS.map(o => (
        <button key={o.key} type="button" onClick={() => onChange(o.key)}
          className={cn('rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
            value === o.key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
