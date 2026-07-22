import { useMemo } from 'react';
import { Briefcase } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { EmployeesPagination } from '@/components/employees/EmployeesPagination';
import { useFunctionFilters } from '../hooks/useFunctionFilters';
import { computeFunctionSummary } from '../domain/functionFilters';
import { FunctionsSummary } from '../components/FunctionsSummary';
import { FunctionsTabs } from '../components/FunctionsTabs';
import { FunctionsFilters } from '../components/FunctionsFilters';
import { FunctionsTable, type FunctionRowHandlers } from '../components/FunctionsTable';
import { FunctionsEmptyState } from '../components/FunctionsEmptyState';
import type { FunctionRow } from '../types/function.types';
import type { SetorOption } from '../hooks/useFunctions';

interface Props {
  rows: FunctionRow[];
  grupos: number;
  setores: SetorOption[];
  handlers: FunctionRowHandlers;
}

export function FunctionsView({ rows, grupos, setores, handlers }: Props) {
  const state = useFunctionFilters(rows);
  const summary = useMemo(() => computeFunctionSummary(rows), [rows]);

  if (rows.length === 0) {
    return <FunctionsEmptyState icon={Briefcase} title="Nenhuma função cadastrada" description="Cadastre funções para organizar os funcionários." />;
  }

  return (
    <div className="space-y-[18px]">
      <FunctionsSummary summary={summary} grupos={grupos} onFilter={state.setFilters} />
      <SectionCard title="Funções" description="Cadastro, utilização e situação das funções.">
        <div className="space-y-4">
          <FunctionsTabs tab={state.tab} onChange={state.setTab} counts={state.counts} />
          <FunctionsFilters filters={state.filters} onChange={state.setFilters} onReset={state.resetFilters} searchInput={state.searchInput} onSearchChange={state.setSearchInput} activeCount={state.activeCount} setores={setores} />
          <FunctionsTable rows={state.paged} handlers={handlers} />
          <EmployeesPagination page={state.page} totalPages={state.totalPages} pageSize={state.pageSize} total={state.filtered.length} onPageChange={state.setPage} onPageSizeChange={state.setPageSize} />
        </div>
      </SectionCard>
    </div>
  );
}
