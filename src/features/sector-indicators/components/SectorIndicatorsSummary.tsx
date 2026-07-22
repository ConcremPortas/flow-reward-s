import { ClipboardList, CheckCircle2, Clock, Target, AlertTriangle, Gauge } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { formatPercentBR } from '@/lib/formatters';
import type { IndicatorSummaryCounts } from '../domain/indicatorCalculations';
import type { SectorIndicatorFilters } from '../types/sector-indicators.types';

interface Props {
  summary: IndicatorSummaryCounts;
  onFilter: (patch: Partial<SectorIndicatorFilters>) => void;
}

/** Cards compactos do resumo da competência — clicáveis para filtrar a matriz. */
export function SectorIndicatorsSummary({ summary, onFilter }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      <StatCard title="Setores previstos" value={String(summary.previstos)} hint="setores ativos" icon={ClipboardList}
        onClick={() => onFilter({ situacao: 'todos', somentePendentes: false, semMedicao: false })} />
      <StatCard title="Apurados" value={String(summary.apurados)} icon={CheckCircle2} status="positive"
        onClick={() => onFilter({ somentePendentes: false, situacao: 'todos' })} />
      <StatCard title="Pendentes" value={String(summary.pendentes)} icon={Clock} status={summary.pendentes > 0 ? 'warning' : 'positive'}
        onClick={() => onFilter({ somentePendentes: true })} />
      <StatCard title="Meta atingida" value={String(summary.metaAtingida)} icon={Target} status="positive"
        onClick={() => onFilter({ situacao: 'superada', somentePendentes: false })} />
      <StatCard title="Em atenção" value={String(summary.emAtencao)} icon={AlertTriangle} status={summary.emAtencao > 0 ? 'warning' : 'positive'}
        onClick={() => onFilter({ situacao: 'proxima', somentePendentes: false })} />
      <StatCard title="Média geral" value={summary.mediaGeral != null ? formatPercentBR(summary.mediaGeral, 1) : '—'}
        hint="setores apurados" icon={Gauge}
        status={summary.mediaGeral == null ? 'neutral' : summary.mediaGeral >= 100 ? 'positive' : summary.mediaGeral >= 95 ? 'warning' : 'critical'} />
    </div>
  );
}
