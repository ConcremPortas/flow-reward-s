import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatNumberBR, formatPercentBR } from '@/lib/formatters';
import { competenciaLabelLong } from '@/features/dashboard/utils/dates';
import { CELL_STATE_META } from '../domain/indicatorStatus';
import { getIndicatorDefinition } from '../domain/indicatorDefinitions';
import type { IndicatorCell } from '../types/sector-indicators.types';

interface Props {
  cell: IndicatorCell;
  competencia: string;
  comparing?: boolean;
}

const fmtDesvio = (d: number | null) => {
  if (d == null) return '—';
  const s = formatNumberBR(Math.abs(d), Number.isInteger(d) ? 0 : 2);
  return d > 0 ? `+${s}` : d < 0 ? `−${s}` : s;
};

/**
 * Célula da matriz — percentual + heatmap suave + tooltip. Sem ícone de tendência
 * repetido: a cor do heatmap já carrega o estado semântico.
 */
export function SectorIndicatorCell({ cell, competencia, comparing }: Props) {
  const def = getIndicatorDefinition(cell.indicatorId);
  const meta = CELL_STATE_META[cell.state];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex min-w-[68px] flex-col items-end rounded-md px-2 py-1 text-right tabular-nums transition-colors', meta.heatmap)}>
          <span className="text-sm font-semibold">
            {cell.state === 'sem_medicao' ? 's/m' : cell.percentual != null ? formatPercentBR(cell.percentual, def.precision) : '—'}
          </span>
          {comparing && cell.variacaoPP != null && (
            <span className={cn('text-[10px]', cell.variacaoPP >= 0 ? 'text-success' : 'text-destructive')}>
              {cell.variacaoPP >= 0 ? '+' : ''}{formatNumberBR(cell.variacaoPP, 1)} p.p.
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px]">
        <p className="font-semibold">{def.label}</p>
        <dl className="mt-1 space-y-0.5 text-xs">
          <Line label="Meta" value={cell.meta != null ? formatNumberBR(cell.meta, Number.isInteger(cell.meta) ? 0 : 2) : '—'} />
          <Line label="Realizado" value={cell.realizado != null ? formatNumberBR(cell.realizado, Number.isInteger(cell.realizado) ? 0 : 2) : '—'} />
          <Line label="Atingimento" value={cell.percentual != null ? formatPercentBR(cell.percentual, def.precision) : '—'} />
          <Line label="Diferença" value={fmtDesvio(cell.desvio)} />
          <Line label="Competência" value={competenciaLabelLong(competencia)} />
          {cell.state === 'sem_medicao' && <p className="pt-1 text-muted-foreground">Registro marcado como sem medição.</p>}
        </dl>
      </TooltipContent>
    </Tooltip>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
