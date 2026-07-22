import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SectionCard } from '@/components/app/SectionCard';
import type { WorkforcePoint } from '@/features/dashboard/types';
import { METAS } from '@/features/dashboard/metricDefinitions';

interface Props {
  workforce: WorkforcePoint[];
  className?: string;
}

/** Estabilidade: admissões × desligamentos + turnover (12 meses). */
export function TurnoverAnalytics({ workforce, className }: Props) {
  return (
    <SectionCard title="Turnover & Estabilidade" description="Turnover = desligamentos ÷ headcount médio × 100" className={className}>
      {workforce.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Sem dados no período.</div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={workforce} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={36} />
              <YAxis yAxisId="right" orientation="right" unit="%" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine yAxisId="right" y={METAS.turnoverMax} stroke="hsl(var(--status-warning))" strokeDasharray="4 4" />
              <Bar yAxisId="left" dataKey="admissoes" name="Admissões" fill="hsl(var(--success))" radius={[3, 3, 0, 0]} maxBarSize={16} />
              <Bar yAxisId="left" dataKey="desligamentos" name="Desligamentos" fill="hsl(var(--destructive))" radius={[3, 3, 0, 0]} maxBarSize={16} />
              <Line yAxisId="right" type="monotone" dataKey="turnover" name="Turnover %" stroke="hsl(var(--status-warning))" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="mt-2 text-[11px] text-muted-foreground">Motivos de desligamento e tempo de casa não estão registrados no banco (ver Qualidade de Dados).</p>
    </SectionCard>
  );
}
