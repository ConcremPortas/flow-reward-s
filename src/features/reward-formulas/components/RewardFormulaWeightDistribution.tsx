import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatPercentBR } from '@/lib/formatters';
import { activeCriteria, type WeightMap } from '../domain/rewardFormulaWeights';

// Paleta discreta (não depende só de cor: tooltip descreve cada segmento).
const SEG = ['bg-[#08783e]', 'bg-[#c8a83f]', 'bg-primary/70', 'bg-sky-500/70', 'bg-violet-500/60', 'bg-rose-500/60', 'bg-teal-500/60', 'bg-amber-500/70', 'bg-indigo-500/60', 'bg-emerald-500/60', 'bg-slate-400'];

/** Distribuição visual compacta dos pesos ativos (barra empilhada + tooltip). */
export function RewardFormulaWeightDistribution({ weights, height = 'h-2' }: { weights: WeightMap; height?: string }) {
  const ativos = activeCriteria(weights);
  const total = ativos.reduce((s, e) => s + e.value, 0);
  if (total <= 0) return <div className={`${height} w-full rounded-full bg-muted`} aria-label="Sem pesos definidos" />;

  return (
    <div className={`flex ${height} w-full overflow-hidden rounded-full bg-muted`} role="img" aria-label="Distribuição dos pesos">
      {ativos.map((e, i) => (
        <Tooltip key={e.key}>
          <TooltipTrigger asChild>
            <div className={`${SEG[i % SEG.length]} h-full`} style={{ width: `${(e.value / total) * 100}%` }} />
          </TooltipTrigger>
          <TooltipContent>{e.label}: {formatPercentBR(e.value, Number.isInteger(e.value) ? 0 : 1)}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
