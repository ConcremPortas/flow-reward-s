import { useState } from 'react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { Target, Award, Wallet, TrendingDown } from 'lucide-react';
import { formatCurrencyBRL, formatPercentBR } from '@/lib/formatters';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { BasePremiacao } from '@/hooks/useBasePremiacao';
import { useRewardsReconciliation } from '../hooks/useRewardsReconciliation';
import { sortGroups, type GroupSort } from '../domain/rewardsReportGrouping';
import { RewardsReconciliationFunnel } from '../components/RewardsReconciliationFunnel';
import { RewardsImpactByCriterion } from '../components/RewardsImpactByCriterion';
import { RewardsLargestDifferences } from '../components/RewardsLargestDifferences';
import { RewardsGroupTable } from '../components/RewardsGroupTable';

interface Props {
  rows: ResultadoPremiacao[];
  bases: BasePremiacao[];
  onOpenById: (id: string) => void;
}

export function RewardsReconciliationView({ rows, bases, onOpenById }: Props) {
  const { totals, funnel, impactos, maioresDiferencas, porSetor, porBase } = useRewardsReconciliation(rows, bases);
  const [sortSetor, setSortSetor] = useState<GroupSort>('diferenca');

  return (
    <div className="space-y-[18px]">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Possível" value={formatCurrencyBRL(totals.possivel)} icon={Target} />
        <StatCard title="Alcançado" value={formatCurrencyBRL(totals.alcancado)} icon={Award} />
        <StatCard title="Final" value={formatCurrencyBRL(totals.final)} icon={Wallet} status="positive" />
        <StatCard title="Perda de potencial" value={formatCurrencyBRL(totals.alcancado - totals.possivel)} icon={TrendingDown}
          hint={totals.atingimento != null ? `${formatPercentBR(totals.atingimento, 1)} atingido` : undefined}
          status={totals.alcancado - totals.possivel < 0 ? 'critical' : 'positive'} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-5"><SectionCard title="Funil financeiro" description="Possível → alcançado → final."><RewardsReconciliationFunnel funnel={funnel} totals={totals} /></SectionCard></div>
        <div className="xl:col-span-7"><SectionCard title="Impactos por critério"><RewardsImpactByCriterion impactos={impactos} /></SectionCard></div>
      </div>

      <SectionCard title="Maiores diferenças individuais" description="Clique para abrir a memória de cálculo."><RewardsLargestDifferences rows={maioresDiferencas} onOpen={onOpenById} /></SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard title="Setores com maior diferença"><RewardsGroupTable rows={sortGroups(porSetor, sortSetor)} firstColLabel="Setor" sort={sortSetor} onSortChange={setSortSetor} /></SectionCard>
        <SectionCard title="Bases com maior diferença"><RewardsGroupTable rows={sortGroups(porBase, 'diferenca')} firstColLabel="Base" compact /></SectionCard>
      </div>
    </div>
  );
}
