import { Coins, CheckCircle2, Unlink, AlertTriangle, Settings2 } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import type { RewardBaseSummaryCounts } from '../domain/rewardBaseFilters';
import type { RewardBaseFilters } from '../types/reward-base.types';

interface Props { summary: RewardBaseSummaryCounts; onFilter: (patch: Partial<RewardBaseFilters>) => void }

export function RewardBasesSummary({ summary, onFilter }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      <StatCard title="Total de bases" value={String(summary.total)} icon={Coins}
        onClick={() => onFilter({ tipo: 'todos', utilizacao: 'todos', situacao: 'todos' })} />
      <StatCard title="Em uso" value={String(summary.emUso)} icon={CheckCircle2} status="positive"
        onClick={() => onFilter({ utilizacao: 'em_uso' })} />
      <StatCard title="Sem vínculo" value={String(summary.semVinculo)} icon={Unlink} status={summary.semVinculo > 0 ? 'warning' : 'positive'}
        onClick={() => onFilter({ utilizacao: 'sem_vinculo' })} />
      <StatCard title="A revisar" value={String(summary.aRevisar)} icon={AlertTriangle} status={summary.aRevisar > 0 ? 'warning' : 'positive'}
        onClick={() => onFilter({ situacao: 'revisar' })} />
      <StatCard title="Config. incompleta" value={String(summary.configIncompleta)} icon={Settings2} status={summary.configIncompleta > 0 ? 'critical' : 'positive'}
        onClick={() => onFilter({ situacao: 'config_incompleta' })} />
    </div>
  );
}
