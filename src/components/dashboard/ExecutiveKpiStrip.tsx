import type { ExecutiveMetric, HealthIndex } from '@/features/dashboard/types';
import { HrHealthIndex } from './HrHealthIndex';
import { MetricTrendCard } from './MetricTrendCard';

interface ExecutiveKpiStripProps {
  health: HealthIndex;
  metrics: ExecutiveMetric[];   // 4 indicadores selecionados
  onOpenHealth: () => void;
  onMetricClick: (key: string) => void;
}

/**
 * Faixa de indicadores da primeira dobra: Índice de Saúde (destaque) + 4 KPIs.
 * Todos com a mesma altura (grid items-stretch).
 */
export function ExecutiveKpiStrip({ health, metrics, onOpenHealth, onMetricClick }: ExecutiveKpiStripProps) {
  return (
    <div className="grid grid-cols-2 items-stretch gap-[18px] md:grid-cols-3 min-[1400px]:grid-cols-5">
      <div className="col-span-2 md:col-span-3 min-[1400px]:col-span-1">
        <HrHealthIndex health={health} onOpen={onOpenHealth} />
      </div>
      {metrics.map((m) => (
        <MetricTrendCard key={m.key} metric={m} onClick={onMetricClick} />
      ))}
    </div>
  );
}
