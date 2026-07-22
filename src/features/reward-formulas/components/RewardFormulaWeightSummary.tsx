import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatPercentBR } from '@/lib/formatters';
import { RewardFormulaWeightDistribution } from './RewardFormulaWeightDistribution';
import type { WeightValidation } from '../domain/rewardFormulaValidation';
import type { WeightMap } from '../domain/rewardFormulaWeights';

const pct = (n: number) => formatPercentBR(n, Number.isInteger(n) ? 0 : 1);

/** Resumo fixo do editor: total / faltante / excedente / ativos + barra. Tempo real. */
export function RewardFormulaWeightSummary({ weights, validation }: { weights: WeightMap; validation: WeightValidation }) {
  const { total, missing, excess, valid, activeCriteria } = validation;
  return (
    <div className="rounded-xl border border-border/70 bg-card p-3 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total dos pesos</p>
          <p className={`text-2xl font-bold tabular-nums ${valid ? 'text-[#7a5f16]' : 'text-destructive'}`}>{pct(total)}</p>
        </div>
        <div className="text-right text-sm">
          {valid ? (
            <span className="inline-flex items-center gap-1 font-medium text-success"><CheckCircle2 className="h-4 w-4" /> Completa</span>
          ) : missing > 0 ? (
            <span className="inline-flex items-center gap-1 font-medium text-destructive"><AlertTriangle className="h-4 w-4" /> Faltam {pct(missing)}</span>
          ) : (
            <span className="inline-flex items-center gap-1 font-medium text-destructive"><AlertTriangle className="h-4 w-4" /> Excede {pct(excess)}</span>
          )}
          <p className="mt-0.5 text-xs text-muted-foreground">{activeCriteria} critério(s) ativo(s)</p>
        </div>
      </div>
      <div className="mt-2"><RewardFormulaWeightDistribution weights={weights} height="h-2.5" /></div>
    </div>
  );
}
