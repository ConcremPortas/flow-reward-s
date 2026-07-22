import { XCircle, AlertTriangle, Users, ListChecks } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import type { IssuesSummary } from '../domain/rewardsIssues';

export function RewardsIssuesSummary({ summary }: { summary: IssuesSummary }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard title="Bloqueios" value={String(summary.bloqueios)} icon={XCircle} status={summary.bloqueios > 0 ? 'critical' : 'positive'} />
      <StatCard title="Atenções" value={String(summary.atencoes)} icon={AlertTriangle} status={summary.atencoes > 0 ? 'warning' : 'positive'} />
      <StatCard title="Funcionários afetados" value={String(summary.funcionariosAfetados)} icon={Users} />
      <StatCard title="Total de apontamentos" value={String(summary.total)} icon={ListChecks} />
    </div>
  );
}
