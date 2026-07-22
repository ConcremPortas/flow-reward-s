import { useMemo } from 'react';
import { Coins } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { useRewardBaseFilters } from '../hooks/useRewardBaseFilters';
import { computeRewardBaseSummary } from '../domain/rewardBaseFilters';
import { RewardBasesSummary } from '../components/RewardBasesSummary';
import { RewardBasesTabs } from '../components/RewardBasesTabs';
import { RewardBasesFilters } from '../components/RewardBasesFilters';
import { RewardBasesTable, type RewardBaseRowHandlers } from '../components/RewardBasesTable';
import { RewardBasesEmptyState } from '../components/RewardBasesEmptyState';
import type { RewardBaseRow } from '../types/reward-base.types';

interface Props { rows: RewardBaseRow[]; handlers: RewardBaseRowHandlers }

export function RewardBasesView({ rows, handlers }: Props) {
  const state = useRewardBaseFilters(rows);
  const summary = useMemo(() => computeRewardBaseSummary(rows), [rows]);

  if (rows.length === 0) {
    return <RewardBasesEmptyState icon={Coins} title="Nenhuma base cadastrada" description="Cadastre bases para configurar o cálculo das premiações." />;
  }

  return (
    <div className="space-y-[18px]">
      <RewardBasesSummary summary={summary} onFilter={state.setFilters} />
      <SectionCard title="Bases" description="Parâmetros e vínculos usados no cálculo das premiações.">
        <div className="space-y-4">
          <RewardBasesTabs tab={state.tab} onChange={state.setTab} counts={state.counts} />
          <RewardBasesFilters filters={state.filters} onChange={state.setFilters} onReset={state.resetFilters} searchInput={state.searchInput} onSearchChange={state.setSearchInput} activeCount={state.activeCount} />
          <RewardBasesTable rows={state.filtered} handlers={handlers} />
          <p className="text-xs text-muted-foreground">Mostrando {state.filtered.length} de {rows.length} bases.</p>
        </div>
      </SectionCard>
    </div>
  );
}
