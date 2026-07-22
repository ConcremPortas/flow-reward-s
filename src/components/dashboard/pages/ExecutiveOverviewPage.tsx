import type { ExecutiveMetric } from '@/features/dashboard/types';
import { fmtInt } from '@/features/dashboard/utils/format';
import { ExecutiveKpiStrip } from '../ExecutiveKpiStrip';
import { WorkforceEvolution } from '../WorkforceEvolution';
import { AttentionPreview } from '../AttentionPreview';
import { ManagementInsightBar } from '../ManagementInsightBar';
import { SectorPerformanceHeatmap } from '../SectorPerformanceHeatmap';
import type { PageProps } from './_shared';

const STRIP = ['ativos', 'absenteismo', 'turnover', 'premiacao'];

/** Página 1 — Visão Executiva (compacta, ~1 dobra). */
export function ExecutiveOverviewPage({ dash, openDrawer, onSeeAllAttention }: PageProps) {
  const metrics = STRIP.map((k) => dash.executive.find((m) => m.key === k)).filter(Boolean) as ExecutiveMetric[];
  const mv = dash.workforce[dash.workforce.length - 1] ?? null;
  const final = mv?.ativos ?? 0, adm = mv?.admissoes ?? 0, desl = mv?.desligamentos ?? 0;
  const ini = final - (adm - desl);
  const analitico = dash.viewMode === 'analitico';

  return (
    <div className="space-y-[18px]">
      <ExecutiveKpiStrip
        health={dash.health}
        metrics={metrics}
        onOpenHealth={() => openDrawer({ kind: 'health', health: dash.health })}
        onMetricClick={(k) => { const m = dash.executive.find((x) => x.key === k); if (m) openDrawer({ kind: 'metric', metric: m }); }}
      />

      <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-12">
        <WorkforceEvolution
          className="xl:col-span-8"
          data={dash.workforce}
          onMonthClick={(c) => dash.setFilters({ competencia: c })}
          footer={
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Movimentação do mês</span>
              <span className="text-muted-foreground">Inicial <b className="text-foreground">{fmtInt(ini)}</b></span>
              <span className="text-success">+{fmtInt(adm)} admissões</span>
              <span className="text-destructive">−{fmtInt(desl)} desligamentos</span>
              <span className="text-muted-foreground">Final <b className="text-foreground">{fmtInt(final)}</b></span>
            </div>
          }
        />
        <AttentionPreview className="xl:col-span-4" items={dash.attention} onSeeAll={onSeeAllAttention} />
      </div>

      <ManagementInsightBar insights={dash.insights} />

      {analitico && (
        <SectorPerformanceHeatmap rows={dash.sectors} onOpenSector={(s) => openDrawer({ kind: 'sector', sector: s })} />
      )}
    </div>
  );
}
