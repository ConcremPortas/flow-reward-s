import type { ExecutiveMetric } from '@/features/dashboard/types';
import { MetricTrendCard } from './MetricTrendCard';
import { UnavailableMetric } from './UnavailableMetric';

interface ExecutiveSummaryProps {
  metrics: ExecutiveMetric[];
  onMetricClick?: (key: string) => void;
}

/** Resumo Executivo: 6 KPIs (com estado de indisponível quando faltar fonte). */
export function ExecutiveSummary({ metrics, onMetricClick }: ExecutiveSummaryProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {metrics.map(m =>
        m.available ? (
          <MetricTrendCard key={m.key} metric={m} onClick={onMetricClick} />
        ) : (
          <UnavailableMetric key={m.key} title={m.title} reason={m.unavailableReason || 'Sem fonte de dados.'} />
        ),
      )}
    </div>
  );
}
