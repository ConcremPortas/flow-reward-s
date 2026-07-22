import { Layers, CheckCircle2, Unlink, CircleDollarSign, AlertTriangle } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import type { TierSummaryCounts } from '../domain/bonusTierFilters';
import type { BonusTierFilters } from '../types/bonus-tier.types';

interface Props { summary: TierSummaryCounts; onFilter: (patch: Partial<BonusTierFilters>) => void }

/** Cards compactos do resumo — clicáveis. Valor zero é neutro (não crítico). */
export function BonusTiersSummary({ summary, onFilter }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      <StatCard title="Total de faixas" value={String(summary.total)} icon={Layers}
        onClick={() => onFilter({ utilizacao: 'todos', situacao: 'todos', valorZero: false, comDivergencia: false })} />
      <StatCard title="Em uso" value={String(summary.emUso)} icon={CheckCircle2} status="positive"
        onClick={() => onFilter({ utilizacao: 'em_uso' })} />
      <StatCard title="Sem vínculo" value={String(summary.semVinculo)} icon={Unlink} status={summary.semVinculo > 0 ? 'warning' : 'positive'}
        onClick={() => onFilter({ utilizacao: 'sem_vinculo' })} />
      <StatCard title="Valor zero" value={String(summary.valorZero)} icon={CircleDollarSign} status="neutral"
        onClick={() => onFilter({ valorZero: true })} />
      <StatCard title="A revisar" value={String(summary.aRevisar)} icon={AlertTriangle} status={summary.aRevisar > 0 ? 'warning' : 'positive'}
        onClick={() => onFilter({ situacao: 'revisar' })} />
    </div>
  );
}
