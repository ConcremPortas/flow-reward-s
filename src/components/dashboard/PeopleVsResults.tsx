import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import { SectionCard } from '@/components/app/SectionCard';
import type { RiskLevel, ScatterPoint } from '@/features/dashboard/types';
import { METAS } from '@/features/dashboard/metricDefinitions';
import { fmtCurrency } from '@/features/dashboard/utils/format';

const RISK_COLOR: Record<RiskLevel, string> = {
  baixo: 'hsl(var(--success))', medio: 'hsl(var(--status-warning))', alto: 'hsl(var(--destructive))',
};

interface Props {
  points: ScatterPoint[];
  onOpenSector?: (setorId: string) => void;
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TooltipContent({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload as ScatterPoint;
  return (
    <div className="rounded-lg border border-border bg-card p-2.5 text-xs shadow-md">
      <p className="font-semibold text-foreground">{p.setor}</p>
      <p className="text-muted-foreground">{p.headcount} pessoas · produção {p.producaoPct.toFixed(0)}%</p>
      <p className="text-muted-foreground">Absent. {p.absenteismo?.toFixed(1) ?? '—'} · DSS {p.dssPct?.toFixed(0) ?? '—'}% · EPI {p.epiPendencias}</p>
      <p className="text-muted-foreground">Prem. média {fmtCurrency(p.premiacaoMedia)}</p>
      <p className="mt-1 capitalize" style={{ color: RISK_COLOR[p.risco] }}>Risco {p.risco}</p>
    </div>
  );
}

export function PeopleVsResults({ points, onOpenSector, className }: Props) {
  return (
    <SectionCard
      title="Pessoas × Resultado"
      description="Quadro (X) × atingimento de produção (Y) · tamanho = premiação média · cor = risco"
      className={className}
    >
      {points.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Sem setores com produção registrada no período.</div>
      ) : (
        <>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 12, bottom: 10, left: -8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" dataKey="headcount" name="Pessoas" tick={{ fontSize: 11 }} tickLine={false}
                  axisLine={{ stroke: 'hsl(var(--border))' }} label={{ value: 'Pessoas', position: 'insideBottomRight', offset: -4, fontSize: 11 }} />
                <YAxis type="number" dataKey="producaoPct" name="Produção" unit="%" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
                <ZAxis type="number" dataKey="premiacaoMedia" range={[60, 500]} name="Prem. média" />
                <ReferenceLine y={METAS.producaoMeta} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
                <Tooltip content={<TooltipContent />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter
                  data={points}
                  onClick={(p: ScatterPoint) => onOpenSector?.(p.setorId)}
                  cursor="pointer"
                >
                  {points.map(p => <Cell key={p.setorId} fill={RISK_COLOR[p.risco]} fillOpacity={0.75} />)}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
            {(['baixo', 'medio', 'alto'] as RiskLevel[]).map(r => (
              <span key={r} className="inline-flex items-center gap-1.5 capitalize">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: RISK_COLOR[r] }} /> Risco {r}
              </span>
            ))}
            <span className="ml-auto">Linha tracejada = meta {METAS.producaoMeta}%</span>
          </div>
        </>
      )}
    </SectionCard>
  );
}
