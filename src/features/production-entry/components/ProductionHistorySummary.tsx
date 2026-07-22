import { Database, CalendarRange, Factory, Gauge, TrendingUp, TrendingDown } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { formatPercentBR } from '@/lib/formatters';
import type { ProductionHistoryRow } from '../types/production-entry.types';

/** Cards do resumo do Histórico — só métricas reais das linhas filtradas. */
export function ProductionHistorySummary({ rows }: { rows: ProductionHistoryRow[] }) {
  const competencias = new Set(rows.map((r) => r.competencia)).size;
  const setores = new Set(rows.map((r) => r.setorId)).size;
  const percentuais = rows.map((r) => r.percentual).filter((p): p is number => p != null);
  const media = percentuais.length > 0 ? percentuais.reduce((a, b) => a + b, 0) / percentuais.length : null;
  const acima = rows.filter((r) => r.situacao === 'superada').length;
  const abaixo = rows.filter((r) => r.situacao === 'abaixo').length;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      <StatCard title="Registros" value={String(rows.length)} hint="no filtro atual" icon={Database} />
      <StatCard title="Competências" value={String(competencias)} hint="distintas" icon={CalendarRange} />
      <StatCard title="Setores" value={String(setores)} hint="distintos" icon={Factory} />
      <StatCard title="Média de atingimento" value={media != null ? formatPercentBR(media, 1) : '—'} icon={Gauge}
        status={media == null ? 'neutral' : media >= 100 ? 'positive' : media >= 90 ? 'warning' : 'critical'} />
      <StatCard title="Acima da meta" value={String(acima)} icon={TrendingUp} status="positive" />
      <StatCard title="Abaixo da meta" value={String(abaixo)} icon={TrendingDown} status={abaixo > 0 ? 'critical' : 'positive'} />
    </div>
  );
}
