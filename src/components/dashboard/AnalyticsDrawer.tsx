import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ExecutiveMetric, HealthIndex, SectorRow, RiskLevel } from '@/features/dashboard/types';
import { fmtMetric, fmtCurrency } from '@/features/dashboard/utils/format';

export type DrawerData =
  | { kind: 'health'; health: HealthIndex }
  | { kind: 'sector'; sector: SectorRow }
  | { kind: 'metric'; metric: ExecutiveMetric };

const RISK_TINT: Record<RiskLevel, string> = {
  baixo: 'text-success', medio: 'text-status-warning', alto: 'text-destructive',
};

interface Props {
  data: DrawerData | null;
  onClose: () => void;
}

export function AnalyticsDrawer({ data, onClose }: Props) {
  const navigate = useNavigate();

  const title = data?.kind === 'health' ? 'Índice de Saúde do RH'
    : data?.kind === 'sector' ? data.sector.setor
    : data?.kind === 'metric' ? data.metric.title
    : '';

  return (
    <Sheet open={!!data} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>

        {data?.kind === 'health' && (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-4xl font-bold text-foreground">{data.health.score}<span className="text-lg text-muted-foreground">/100</span></p>
              {data.health.partial && <p className="text-xs text-muted-foreground">Score parcial — pesos redistribuídos entre componentes com dados.</p>}
            </div>
            <div className="space-y-3">
              {data.health.components.map(c => (
                <div key={c.key} className="rounded-lg border border-border/70 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{c.label}</span>
                    <span className="text-muted-foreground">{c.available ? `${Math.round(c.score)} · peso ${c.weight.toFixed(0)}%` : 'sem dados'}</span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.detail}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">Fórmula: média ponderada dos componentes disponíveis; ausentes têm o peso redistribuído.</p>
          </div>
        )}

        {data?.kind === 'sector' && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">{data.sector.unidade ?? 'Unidade —'}{data.sector.gestor ? ` · gestor: ${data.sector.gestor}` : ''}</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Pessoas', String(data.sector.headcount)],
                ['Produção', data.sector.producaoPct == null ? '—' : `${data.sector.producaoPct.toFixed(0)}%`],
                ['Absenteísmo', data.sector.absenteismo == null ? '—' : data.sector.absenteismo.toFixed(1)],
                ['DSS', data.sector.dssPct == null ? '—' : `${data.sector.dssPct.toFixed(0)}%`],
                ['EPI pendências', String(data.sector.epiPendencias)],
                ['Advertências', String(data.sector.advertencias)],
                ['Elegibilidade', data.sector.elegibilidadePct == null ? '—' : `${data.sector.elegibilidadePct}%`],
                ['Prem. média', data.sector.premiacaoMedia == null ? '—' : fmtCurrency(data.sector.premiacaoMedia)],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg border border-border/70 p-3">
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="mt-0.5 text-base font-semibold text-foreground">{v}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border/70 p-3">
              <p className={cn('text-sm font-semibold capitalize', RISK_TINT[data.sector.risco.level])}>Risco {data.sector.risco.level}</p>
              {data.sector.risco.reasons.length > 0 ? (
                <ul className="mt-1 list-inside list-disc text-xs text-muted-foreground">
                  {data.sector.risco.reasons.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              ) : <p className="mt-1 text-xs text-muted-foreground">Sem fatores de risco relevantes.</p>}
            </div>
            <Button variant="outline" className="w-full" onClick={() => navigate('/premiacoes/producao-setor')}>
              Abrir produção do setor <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
          </div>
        )}

        {data?.kind === 'metric' && (
          <div className="mt-4 space-y-4">
            <p className="text-4xl font-bold text-foreground">{data.metric.value == null ? '—' : fmtMetric(data.metric.value, data.metric.format)}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-border/70 p-3">
                <p className="text-xs text-muted-foreground">Período anterior</p>
                <p className="mt-0.5 text-base font-semibold text-foreground">{data.metric.previous == null ? '—' : fmtMetric(data.metric.previous, data.metric.format)}</p>
              </div>
              <div className="rounded-lg border border-border/70 p-3">
                <p className="text-xs text-muted-foreground">Meta de referência</p>
                <p className="mt-0.5 text-base font-semibold text-foreground">{data.metric.target == null ? '—' : `${data.metric.targetKind === 'max' ? '≤' : '≥'} ${fmtMetric(data.metric.target, data.metric.format)}`}</p>
              </div>
            </div>
            <div className="rounded-lg border border-border/70 p-3">
              <p className="text-xs font-medium text-muted-foreground">Como é calculado</p>
              <p className="mt-1 text-sm text-muted-foreground">{data.metric.tooltip}</p>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
