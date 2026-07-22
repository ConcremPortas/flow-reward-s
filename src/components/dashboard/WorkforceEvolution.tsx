import { useState } from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { SectionCard } from '@/components/app/SectionCard';
import { cn } from '@/lib/utils';
import type { WorkforcePoint } from '@/features/dashboard/types';

type SerieKey = 'ativos' | 'admissoes' | 'desligamentos' | 'saldo' | 'turnover';

const SERIES: { key: SerieKey; label: string; color: string; axis: 'left' | 'right'; type: 'bar' | 'line' }[] = [
  { key: 'ativos', label: 'Headcount', color: 'hsl(var(--primary))', axis: 'left', type: 'line' },
  { key: 'admissoes', label: 'Admissões', color: 'hsl(var(--success))', axis: 'left', type: 'bar' },
  { key: 'desligamentos', label: 'Desligamentos', color: 'hsl(var(--destructive))', axis: 'left', type: 'bar' },
  { key: 'saldo', label: 'Saldo', color: 'hsl(217 90% 55%)', axis: 'left', type: 'line' },
  { key: 'turnover', label: 'Turnover %', color: 'hsl(var(--status-warning))', axis: 'right', type: 'line' },
];

interface WorkforceEvolutionProps {
  data: WorkforcePoint[];
  onMonthClick?: (competencia: string) => void;
  footer?: React.ReactNode;
  className?: string;
}

export function WorkforceEvolution({ data, onMonthClick, footer, className }: WorkforceEvolutionProps) {
  const [active, setActive] = useState<Set<SerieKey>>(new Set(['ativos', 'admissoes', 'desligamentos', 'turnover']));
  const toggle = (k: SerieKey) => setActive(prev => {
    const n = new Set(prev); n.has(k) ? n.delete(k) : n.add(k);
    return n.size === 0 ? prev : n;
  });

  const handleClick = (state: { activeLabel?: string | number }) => {
    if (!onMonthClick || state?.activeLabel == null) return;
    const pt = data.find(d => d.label === state.activeLabel);
    if (pt) onMonthClick(pt.competencia);
  };

  return (
    <SectionCard
      title="Evolução do Quadro (12 meses)"
      description="Headcount, movimentação e turnover"
      className={className}
      actions={
        <div className="flex flex-wrap gap-1.5">
          {SERIES.map(s => (
            <button
              key={s.key}
              type="button"
              onClick={() => toggle(s.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                active.has(s.key) ? 'border-transparent bg-muted text-foreground' : 'border-border text-muted-foreground opacity-60',
              )}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </button>
          ))}
        </div>
      }
    >
      {data.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Sem dados no período.</div>
      ) : (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} onClick={handleClick} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} unit="%" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }}
                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
              />
              {SERIES.filter(s => active.has(s.key)).map(s =>
                s.type === 'bar' ? (
                  <Bar key={s.key} yAxisId={s.axis} dataKey={s.key} name={s.label} fill={s.color} radius={[3, 3, 0, 0]} maxBarSize={18} />
                ) : (
                  <Line key={s.key} yAxisId={s.axis} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} dot={false} />
                ),
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
      {onMonthClick && <p className="mt-2 text-[11px] text-muted-foreground">Clique em um mês para detalhar.</p>}
      {footer && <div className="mt-4 border-t border-border/60 pt-4">{footer}</div>}
    </SectionCard>
  );
}
