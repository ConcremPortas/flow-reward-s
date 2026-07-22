import { Database, CalendarRange, Factory, Gauge, TrendingDown, AlertCircle } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { formatPercentBR } from '@/lib/formatters';
import { INDICATOR_IDS } from '../domain/indicatorDefinitions';
import type { SectorIndicatorHistoryRow } from '../types/sector-indicators.types';

/** Cards do resumo do Histórico — só métricas reais das linhas filtradas. */
export function SectorIndicatorsHistorySummary({ rows }: { rows: SectorIndicatorHistoryRow[] }) {
  const competencias = new Set(rows.map((r) => r.competencia)).size;
  const setores = new Set(rows.map((r) => r.setorId)).size;
  const medias = rows.map((r) => r.media).filter((m): m is number => m != null);
  const media = medias.length > 0 ? medias.reduce((a, b) => a + b, 0) / medias.length : null;
  const indicadoresAbaixo = rows.reduce((acc, r) => acc + INDICATOR_IDS.filter((id) => r.cells[id].state === 'abaixo').length, 0);
  const comPendencia = rows.filter((r) => INDICATOR_IDS.some((id) => r.cells[id].state === 'pendente')).length;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      <StatCard title="Registros" value={String(rows.length)} hint="no filtro atual" icon={Database} />
      <StatCard title="Competências" value={String(competencias)} hint="distintas" icon={CalendarRange} />
      <StatCard title="Setores" value={String(setores)} hint="acompanhados" icon={Factory} />
      <StatCard title="Média de atingimento" value={media != null ? formatPercentBR(media, 1) : '—'} icon={Gauge}
        status={media == null ? 'neutral' : media >= 100 ? 'positive' : media >= 95 ? 'warning' : 'critical'} />
      <StatCard title="Indicadores abaixo" value={String(indicadoresAbaixo)} hint="da meta" icon={TrendingDown} status={indicadoresAbaixo > 0 ? 'critical' : 'positive'} />
      <StatCard title="Setores com pendência" value={String(comPendencia)} icon={AlertCircle} status={comPendencia > 0 ? 'warning' : 'positive'} />
    </div>
  );
}
