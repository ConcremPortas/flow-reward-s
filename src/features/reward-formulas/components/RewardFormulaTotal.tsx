import { formatPercentBR } from '@/lib/formatters';
import type { WeightValidation } from '../domain/rewardFormulaValidation';

const pct = (n: number) => formatPercentBR(n, Number.isInteger(n) ? 0 : 1);

/** Total dos pesos + diferença para 100% (Completa / Faltam / Excede). */
export function RewardFormulaTotal({ validation, className }: { validation: WeightValidation; className?: string }) {
  const { total, missing, excess, valid } = validation;
  const tone = valid ? 'text-[#7a5f16]' : 'text-destructive';
  const label = valid ? 'Completa' : missing > 0 ? `Faltam ${pct(missing)}` : `Excede ${pct(excess)}`;
  return (
    <div className={className}>
      <span className={`text-sm font-bold tabular-nums ${tone}`}>{pct(total)}</span>
      <span className={`block text-[11px] ${valid ? 'text-muted-foreground' : 'text-destructive'}`}>{label}</span>
    </div>
  );
}
