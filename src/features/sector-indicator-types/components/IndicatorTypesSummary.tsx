import { Gauge, Activity, CircleOff, AlertTriangle } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { formatNumberBR } from '@/lib/formatters';
import type { IndicatorTypeSummaryCounts } from '../domain/indicatorTypeFilters';
import type { IndicatorTypeFilters } from '../types/indicator-type.types';

interface Props { summary: IndicatorTypeSummaryCounts; onFilter: (patch: Partial<IndicatorTypeFilters>) => void }

export function IndicatorTypesSummary({ summary, onFilter }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard title="Tipos cadastrados" value={formatNumberBR(summary.total)} icon={Gauge} onClick={() => onFilter({ utilizacao: 'todos', situacao: 'todos' })} />
      <StatCard title="Em utilização" value={formatNumberBR(summary.emUso)} icon={Activity} status="positive" onClick={() => onFilter({ utilizacao: 'em_uso' })} />
      <StatCard title="Sem medição" value={formatNumberBR(summary.semMedicao)} icon={CircleOff} status={summary.semMedicao > 0 ? 'warning' : 'positive'} onClick={() => onFilter({ utilizacao: 'sem_medicao' })} />
      <StatCard title="A revisar" value={formatNumberBR(summary.aRevisar)} icon={AlertTriangle} status={summary.aRevisar > 0 ? 'warning' : 'positive'} onClick={() => onFilter({ situacao: 'revisar' })} />
    </div>
  );
}
