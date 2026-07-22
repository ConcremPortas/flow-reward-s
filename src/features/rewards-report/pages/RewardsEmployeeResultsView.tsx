import { useMemo } from 'react';
import { SectionCard } from '@/components/app/SectionCard';
import { EmployeesPagination } from '@/components/employees/EmployeesPagination';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import { useRewardsResults } from '../hooks/useRewardsResults';
import { temAjuste } from '../domain/rewardsReportMetrics';
import { RewardsResultsViewSelector } from '../components/RewardsResultsViewSelector';
import { RewardsResultsTable } from '../components/RewardsResultsTable';

interface Props {
  rows: ResultadoPremiacao[];
  onOpenResult: (r: ResultadoPremiacao) => void;
}

export function RewardsEmployeeResultsView({ rows, onOpenResult }: Props) {
  const state = useRewardsResults(rows);
  const hasAjustes = useMemo(() => rows.some(temAjuste), [rows]);

  return (
    <SectionCard
      title="Resultados por funcionário"
      description="Clique em um funcionário para ver a memória de cálculo."
      actions={<RewardsResultsViewSelector value={state.view} onChange={state.setView} />}
    >
      <div className="space-y-4">
        <RewardsResultsTable view={state.view} rows={state.paged} hasAjustes={hasAjustes} onOpen={onOpenResult} />
        <EmployeesPagination page={state.page} totalPages={state.totalPages} pageSize={state.pageSize} total={state.total} onPageChange={state.setPage} onPageSizeChange={state.setPageSize} />
      </div>
    </SectionCard>
  );
}
