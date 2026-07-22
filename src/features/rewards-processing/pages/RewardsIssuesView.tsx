import { ShieldCheck } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import type { UseRewardsProcessingReturn } from '../hooks/useRewardsProcessing';
import { useRewardsIssues } from '../hooks/useRewardsIssues';
import { RewardsIssuesSummary } from '../components/RewardsIssuesSummary';
import { RewardsIssuesTable } from '../components/RewardsIssuesTable';
import { RewardsEmptyState } from '../components/RewardsEmptyState';

interface Props { data: UseRewardsProcessingReturn }

export function RewardsIssuesView({ data }: Props) {
  const { issues, summary } = useRewardsIssues({
    funcionarios: data.funcionarios, bases: data.bases, formulas: data.formulas, resultados: data.resultados,
  });

  return (
    <div className="space-y-[18px]">
      <RewardsIssuesSummary summary={summary} />
      <SectionCard title="Inconsistências" description="Qualidade dos cadastros, configuração e registros de processamento — regras centralizadas.">
        {issues.length === 0 ? (
          <RewardsEmptyState icon={ShieldCheck} title="Nenhuma inconsistência detectada" description="Cadastros, fórmulas e processamentos não apresentam problemas detectáveis." />
        ) : (
          <RewardsIssuesTable issues={issues} />
        )}
      </SectionCard>
    </div>
  );
}
