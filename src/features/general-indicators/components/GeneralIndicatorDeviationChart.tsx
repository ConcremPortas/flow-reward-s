import { useMemo } from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { competenciaLabel, competenciaLabelLong } from '@/features/dashboard/utils/dates';
import { formatIndicatorValue, formatIndicatorDeviation } from '../domain/indicatorFormatting';
import type { IndicatorDefinition } from '../domain/indicatorDefinitions';
import type { GeneralIndicatorPoint } from '../types/general-indicators.types';

interface Props {
  points: GeneralIndicatorPoint[];
  def: IndicatorDefinition;
}

/** Desvio da meta (realizado - meta) por competência — positivo e negativo. */
export function GeneralIndicatorDeviationChart({ points, def }: Props) {
  const data = useMemo(() => points
    .filter((p) => p.desvio != null)
    .map((p) => ({ competencia: p.competencia, label: competenciaLabel(p.competencia), desvio: p.desvio as number })), [points]);

  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Sem desvios calculáveis para exibir.</p>;
  }

  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={64}
            tickFormatter={(v: number) => formatIndicatorValue(v, def, { compact: true, withUnit: false })} />
          <ReferenceLine y={0} stroke="hsl(var(--border))" />
          <Tooltip content={<DeviationTooltip def={def} />} />
          <Bar dataKey="desvio" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {data.map((d, i) => <Cell key={i} fill={d.desvio >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TooltipProps {
  def: IndicatorDefinition;
  active?: boolean;
  payload?: { payload: { competencia: string; desvio: number } }[];
}

function DeviationTooltip({ def, active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card p-2.5 text-xs shadow-md">
      <p className="mb-1 font-semibold text-foreground">{competenciaLabelLong(d.competencia)}</p>
      <div className="flex justify-between gap-6">
        <span className="text-muted-foreground">Desvio</span>
        <span className="font-medium text-foreground">{formatIndicatorDeviation(d.desvio, def)}</span>
      </div>
    </div>
  );
}
