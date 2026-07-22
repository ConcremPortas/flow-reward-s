import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { formatCurrencyBRL } from '@/lib/formatters';
import type { RewardResult } from '../types/rewards-processing.types';

/** Distribuição por faixa REAL (nomes vindos do cadastro do funcionário). */
export function RewardsDistribution({ employees }: { employees: RewardResult[] }) {
  const dist = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    for (const e of employees) {
      const key = e.faixa || 'Sem faixa';
      const cur = map.get(key) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += e.bonus_alcancado || 0;
      map.set(key, cur);
    }
    return [...map.entries()].map(([faixa, v]) => ({ faixa, ...v })).sort((a, b) => b.count - a.count);
  }, [employees]);

  const max = Math.max(1, ...dist.map(d => d.count));

  if (dist.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">Sem dados de faixa.</p>;

  return (
    <div className="space-y-2.5">
      {dist.map(d => (
        <div key={d.faixa}>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate text-foreground">{d.faixa}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{d.count} · {formatCurrencyBRL(d.total)}</span>
          </div>
          <Progress value={(d.count / max) * 100} className="mt-1 h-1.5" />
        </div>
      ))}
    </div>
  );
}
