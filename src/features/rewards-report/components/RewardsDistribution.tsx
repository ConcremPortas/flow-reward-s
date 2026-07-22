import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatCurrencyBRL, formatPercentBR } from '@/lib/formatters';
import type { FaixaDistribution } from '../domain/rewardsReconciliation';

/** Distribuição por faixa real; "Sem premiação" destacado à parte. */
export function RewardsDistribution({ dist }: { dist: FaixaDistribution[] }) {
  if (dist.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">Sem dados de distribuição.</p>;
  return (
    <div className="space-y-2.5">
      {dist.map(d => {
        const semBonus = d.faixa === 'Sem premiação';
        return (
          <div key={d.faixa}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className={cn('truncate', semBonus ? 'text-muted-foreground' : 'text-foreground')}>{d.faixa}</span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{d.count} · {formatPercentBR(d.pct, 1)} · {formatCurrencyBRL(d.total)}</span>
            </div>
            <Progress value={d.pct} className={cn('mt-1 h-1.5', semBonus && 'opacity-50')} />
          </div>
        );
      })}
    </div>
  );
}
