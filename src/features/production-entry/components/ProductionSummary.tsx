import { ClipboardList, CheckCircle2, Clock, TrendingUp, Minus, TrendingDown, Gauge } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { formatPercentBR } from '@/lib/formatters';
import type { ProductionSummaryCounts } from '../domain/productionCalculations';
import type { ProductionFilters } from '../types/production-entry.types';

interface Props {
  summary: ProductionSummaryCounts;
  onFilter: (patch: Partial<ProductionFilters>) => void;
}

/** Cards compactos do resumo da competência — clicáveis para filtrar a grade. */
export function ProductionSummary({ summary, onFilter }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
      <StatCard title="Setores previstos" value={String(summary.previstos)} icon={ClipboardList}
        onClick={() => onFilter({ situacao: 'todos', somentePendentes: false })} />
      <StatCard title="Apurados" value={String(summary.apurados)} icon={CheckCircle2} status="positive"
        onClick={() => onFilter({ somentePendentes: false, situacao: 'todos' })} />
      <StatCard title="Pendentes" value={String(summary.pendentes)} icon={Clock} status={summary.pendentes > 0 ? 'warning' : 'positive'}
        onClick={() => onFilter({ somentePendentes: true })} />
      <StatCard title="Acima da meta" value={String(summary.superada)} icon={TrendingUp} status="positive"
        onClick={() => onFilter({ situacao: 'superada', somentePendentes: false })} />
      <StatCard title="Próximos da meta" value={String(summary.proxima)} icon={Minus} status="warning"
        onClick={() => onFilter({ situacao: 'proxima', somentePendentes: false })} />
      <StatCard title="Abaixo da meta" value={String(summary.abaixo)} icon={TrendingDown} status={summary.abaixo > 0 ? 'critical' : 'positive'}
        onClick={() => onFilter({ situacao: 'abaixo', somentePendentes: false })} />
      <StatCard title="Média de atingimento" value={summary.mediaAtingimento != null ? formatPercentBR(summary.mediaAtingimento, 1) : '—'}
        hint="setores apurados" icon={Gauge}
        status={summary.mediaAtingimento == null ? 'neutral' : summary.mediaAtingimento >= 100 ? 'positive' : summary.mediaAtingimento >= 90 ? 'warning' : 'critical'} />
    </div>
  );
}
