import { useMemo } from 'react';
import { Layers } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { EmployeesPagination } from '@/components/employees/EmployeesPagination';
import { useBonusTierFilters } from '../hooks/useBonusTierFilters';
import { computeTierSummary } from '../domain/bonusTierFilters';
import { BonusTiersSummary } from '../components/BonusTiersSummary';
import { BonusTiersTabs } from '../components/BonusTiersTabs';
import { BonusTiersFilters } from '../components/BonusTiersFilters';
import { BonusTiersTable, type BonusTierRowHandlers } from '../components/BonusTiersTable';
import { BonusTiersEmptyState } from '../components/BonusTiersEmptyState';
import type { BonusTierRow } from '../types/bonus-tier.types';

interface Props { rows: BonusTierRow[]; handlers: BonusTierRowHandlers }

export function BonusTiersView({ rows, handlers }: Props) {
  const state = useBonusTierFilters(rows);
  const summary = useMemo(() => computeTierSummary(rows), [rows]);

  if (rows.length === 0) {
    return <BonusTiersEmptyState icon={Layers} title="Nenhuma faixa cadastrada" description="Cadastre faixas para categorizar os valores de premiação." />;
  }

  return (
    <div className="space-y-[18px]">
      <BonusTiersSummary summary={summary} onFilter={state.setFilters} />
      <SectionCard title="Faixas" description="Valores de premiação e sua utilização.">
        <div className="space-y-4">
          <BonusTiersTabs tab={state.tab} onChange={state.setTab} counts={state.counts} />
          <BonusTiersFilters filters={state.filters} onChange={state.setFilters} onReset={state.resetFilters} searchInput={state.searchInput} onSearchChange={state.setSearchInput} activeCount={state.activeCount} />
          <BonusTiersTable rows={state.paged} handlers={handlers} />
          <EmployeesPagination page={state.page} totalPages={state.totalPages} pageSize={state.pageSize} total={state.filtered.length} onPageChange={state.setPage} onPageSizeChange={state.setPageSize} />
        </div>
      </SectionCard>
    </div>
  );
}
