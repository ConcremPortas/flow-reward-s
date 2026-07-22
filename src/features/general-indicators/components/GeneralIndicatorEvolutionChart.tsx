import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { formatPercentBR } from '@/lib/formatters';
import { competenciaLabel, competenciaLabelLong } from '@/features/dashboard/utils/dates';
import { formatIndicatorValue, formatIndicatorDeviation } from '../domain/indicatorFormatting';
import type { IndicatorDefinition } from '../domain/indicatorDefinitions';
import type { GeneralIndicatorPoint } from '../types/general-indicators.types';

interface Props {
  points: GeneralIndicatorPoint[]; // série (asc), sem nulos
  def: IndicatorDefinition;
  onSelectCompetencia?: (competencia: string) => void;
}

/** Evolução Meta × Realizado (até 12 competências) de um único indicador. */
export function GeneralIndicatorEvolutionChart({ points, def, onSelectCompetencia }: Props) {
  const data = useMemo(() => points.map((p) => ({
    competencia: p.competencia,
    label: competenciaLabel(p.competencia),
    meta: p.meta,
    realizado: p.realizado,
    atingimento: p.atingimento,
    desvio: p.desvio,
  })), [points]);

  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Sem dados para exibir a evolução.</p>;
  }

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 8, right: 12, bottom: 0, left: 4 }}
          onClick={(e: { activeLabel?: string }) => {
            const found = data.find((d) => d.label === e?.activeLabel);
            if (found && onSelectCompetencia) onSelectCompetencia(found.competencia);
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={64}
            tickFormatter={(v: number) => formatIndicatorValue(v, def, { compact: true, withUnit: false })} />
          <Tooltip content={<EvolutionTooltip def={def} />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="meta" name="Meta" stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" dot={false} connectNulls isAnimationActive={false} />
          <Line type="monotone" dataKey="realizado" name="Realizado" stroke="hsl(var(--primary))" strokeWidth={2.25} dot={{ r: 2 }} connectNulls isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TooltipProps {
  def: IndicatorDefinition;
  active?: boolean;
  payload?: { payload: { competencia: string; meta: number | null; realizado: number | null; atingimento: number | null; desvio: number | null } }[];
}

function EvolutionTooltip({ def, active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-card p-2.5 text-xs shadow-md">
      <p className="mb-1 font-semibold text-foreground">{competenciaLabelLong(d.competencia)}</p>
      <Line2 label="Meta" value={formatIndicatorValue(d.meta, def)} />
      <Line2 label="Realizado" value={formatIndicatorValue(d.realizado, def)} />
      <Line2 label="Atingimento" value={d.atingimento != null ? formatPercentBR(d.atingimento, 1) : '—'} />
      <Line2 label="Desvio" value={formatIndicatorDeviation(d.desvio, def)} />
    </div>
  );
}

function Line2({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
