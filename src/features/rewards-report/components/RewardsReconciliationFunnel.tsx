import { cn } from '@/lib/utils';
import { formatCurrencyBRL } from '@/lib/formatters';
import type { FinancialTotals, FunnelStep } from '../types/rewards-report.types';

interface Props { funnel: FunnelStep[]; totals: FinancialTotals }

/** Funil financeiro Possível → Alcançado → (ajustes) → Final. Só etapas reais. */
export function RewardsReconciliationFunnel({ funnel, totals }: Props) {
  const max = Math.max(1, totals.possivel, totals.final, totals.alcancado);
  return (
    <div className="space-y-3">
      {funnel.map(step => {
        if (step.kind === 'delta') {
          const positive = step.value >= 0;
          return (
            <div key={step.key} className="flex items-center justify-between rounded-lg border border-dashed border-border/70 px-3 py-1.5 text-sm">
              <span className="text-muted-foreground">{step.label}</span>
              <span className={cn('font-medium tabular-nums', positive ? 'text-success' : 'text-destructive')}>{positive ? '+' : '−'}{formatCurrencyBRL(Math.abs(step.value))}</span>
            </div>
          );
        }
        const pct = (step.value / max) * 100;
        return (
          <div key={step.key}>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{step.label}</span>
              <span className="font-semibold tabular-nums text-foreground">{formatCurrencyBRL(step.value)}</span>
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted">
              <div className={cn('h-full rounded-full', step.key === 'final' ? 'bg-[#c8a83f]' : step.key === 'possivel' ? 'bg-primary/40' : 'bg-primary')} style={{ width: `${Math.max(2, Math.min(pct, 100))}%` }} />
            </div>
          </div>
        );
      })}
      {!totals.temAjustes && (
        <p className="pt-1 text-xs text-muted-foreground">Não há ajustes manuais neste escopo — o <b>Valor Final</b> é igual ao <b>Bônus Alcançado</b>.</p>
      )}
    </div>
  );
}
