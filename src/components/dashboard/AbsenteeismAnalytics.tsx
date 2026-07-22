import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { SectionCard } from '@/components/app/SectionCard';
import type { SectorRow } from '@/features/dashboard/types';
import { METAS } from '@/features/dashboard/metricDefinitions';

interface Props {
  trends: { labels: string[]; absenteismo: number[] };
  sectors: SectorRow[];
  className?: string;
}

export function AbsenteeismAnalytics({ trends, sectors, className }: Props) {
  const data = trends.labels.map((label, i) => ({ label, valor: trends.absenteismo[i] ?? 0 }));
  const porSetor = sectors
    .filter(s => s.absenteismo != null && s.headcount > 0)
    .sort((a, b) => (b.absenteismo as number) - (a.absenteismo as number))
    .slice(0, 8);
  const maxSetor = Math.max(1, ...porSetor.map(s => s.absenteismo as number));

  return (
    <SectionCard title="Absenteísmo & Presença" description="Índice = faltas ÷ headcount × 100 (aproximação sem base de horas previstas)" className={className}>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Evolução mensal</p>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
                <ReferenceLine y={METAS.absenteismoMax} stroke="hsl(var(--status-warning))" strokeDasharray="4 4" />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
                <Line type="monotone" dataKey="valor" name="Absenteísmo" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Maiores índices por setor</p>
          {porSetor.length === 0 ? <p className="text-xs text-muted-foreground">Sem dados no período.</p> : (
            <div className="space-y-2">
              {porSetor.map(s => (
                <div key={s.setorId}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate text-muted-foreground">{s.setor}</span>
                    <span className="font-medium text-foreground">{(s.absenteismo as number).toFixed(1)}</span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${(s.absenteismo as number) > METAS.absenteismoMax ? 'bg-destructive' : 'bg-success'}`}
                      style={{ width: `${((s.absenteismo as number) / maxSetor) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
