import { useState } from 'react';
import { SectionCard } from '@/components/app/SectionCard';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { BasePremiacao } from '@/hooks/useBasePremiacao';
import { useRewardsReportSummary } from '../hooks/useRewardsReportSummary';
import { sortGroups, type GroupSort } from '../domain/rewardsReportGrouping';
import { RewardsFinancialSummary } from '../components/RewardsFinancialSummary';
import { RewardsCoverageSummary } from '../components/RewardsCoverageSummary';
import { RewardsImpactByCriterion } from '../components/RewardsImpactByCriterion';
import { RewardsDistribution } from '../components/RewardsDistribution';
import { RewardsManagementInsights } from '../components/RewardsManagementInsights';
import { RewardsGroupTable } from '../components/RewardsGroupTable';

interface Props {
  rows: ResultadoPremiacao[];
  bases: BasePremiacao[];
  onFilterBaseAndGo: (baseId: string) => void;
}

export function RewardsExecutiveSummaryView({ rows, bases, onFilterBaseAndGo }: Props) {
  const { totals, porBase, porSetor, impactos, distribuicao, insights } = useRewardsReportSummary(rows, bases);
  const [sort, setSort] = useState<GroupSort>('valor');

  return (
    <div className="space-y-[18px]">
      <RewardsFinancialSummary totals={totals} />
      <RewardsCoverageSummary totals={totals} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8"><SectionCard title="Composição da diferença" description="Impacto operacional por critério."><RewardsImpactByCriterion impactos={impactos} /></SectionCard></div>
        <div className="xl:col-span-4"><SectionCard title="Distribuição" description="Por faixa real."><RewardsDistribution dist={distribuicao} /></SectionCard></div>
      </div>

      <SectionCard title="Leitura do período" description="Apontamentos automáticos."><RewardsManagementInsights insights={insights} /></SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8"><SectionCard title="Resultado por setor"><RewardsGroupTable rows={sortGroups(porSetor, sort)} firstColLabel="Setor" sort={sort} onSortChange={setSort} /></SectionCard></div>
        <div className="xl:col-span-4"><SectionCard title="Resultado por base" description="Clique para filtrar."><RewardsGroupTable rows={porBase} firstColLabel="Base" compact onRowClick={(r) => onFilterBaseAndGo(r.key)} /></SectionCard></div>
      </div>
    </div>
  );
}
