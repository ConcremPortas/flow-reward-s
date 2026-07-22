import { SectionCard } from '@/components/app/SectionCard';
import { cn } from '@/lib/utils';
import type { RiskLevel } from '@/features/dashboard/types';
import { fmtCurrency } from '@/features/dashboard/utils/format';
import { SectorPerformanceHeatmap } from '../SectorPerformanceHeatmap';
import { PeopleVsResults } from '../PeopleVsResults';
import type { PageProps } from './_shared';

const RISK_META: Record<RiskLevel, { label: string; bar: string; text: string }> = {
  alto: { label: 'Alto', bar: 'bg-destructive', text: 'text-destructive' },
  medio: { label: 'Médio', bar: 'bg-status-warning', text: 'text-status-warning' },
  baixo: { label: 'Baixo', bar: 'bg-success', text: 'text-success' },
};

/** Página 4 — Performance dos Setores. */
export function SectorPerformancePage({ dash, openDrawer }: PageProps) {
  const total = dash.sectors.length || 1;
  const counts: Record<RiskLevel, number> = { alto: 0, medio: 0, baixo: 0 };
  dash.sectors.forEach((s) => { counts[s.risco.level] += 1; });
  const ranking = dash.rewards.ranking.slice(0, 6);
  const rankMax = Math.max(1, ...ranking.map((r) => r.total));

  return (
    <div className="space-y-[18px]">
      <SectorPerformanceHeatmap rows={dash.sectors} onOpenSector={(s) => openDrawer({ kind: 'sector', sector: s })} />

      <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-12">
        <PeopleVsResults className="xl:col-span-8" points={dash.scatter} onOpenSector={(id) => { const s = dash.sectors.find((x) => x.setorId === id); if (s) openDrawer({ kind: 'sector', sector: s }); }} />

        <div className="space-y-[18px] xl:col-span-4">
          <SectionCard title="Distribuição de Risco" description="Setores por nível de risco">
            <div className="space-y-3">
              {(['alto', 'medio', 'baixo'] as RiskLevel[]).map((lvl) => {
                const m = RISK_META[lvl];
                const n = counts[lvl];
                return (
                  <div key={lvl}>
                    <div className="flex items-center justify-between text-sm">
                      <span className={cn('font-medium', m.text)}>{m.label}</span>
                      <span className="text-muted-foreground">{n} setor(es)</span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div className={cn('h-full rounded-full', m.bar)} style={{ width: `${(n / total) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Ranking por Setor" description="Bônus alcançado no período">
            {ranking.length === 0 ? (
              <p className="text-xs text-muted-foreground">Sem resultados no período.</p>
            ) : (
              <div className="space-y-2">
                {ranking.map((r) => (
                  <div key={r.setor}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="truncate text-muted-foreground">{r.setor}</span>
                      <span className="font-medium text-foreground">{fmtCurrency(r.total)}</span>
                    </div>
                    <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-success" style={{ width: `${(r.total / rankMax) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
