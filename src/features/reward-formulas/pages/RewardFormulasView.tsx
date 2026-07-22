import { useMemo } from 'react';
import { Calculator } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { useRewardFormulaFilters } from '../hooks/useRewardFormulaFilters';
import { computeFormulaSummary } from '../domain/rewardFormulaFilters';
import { RewardFormulasSummary } from '../components/RewardFormulasSummary';
import { RewardFormulasFilters } from '../components/RewardFormulasFilters';
import { RewardFormulasTable, type RewardFormulaRowHandlers } from '../components/RewardFormulasTable';
import { RewardFormulasEmptyState } from '../components/RewardFormulasEmptyState';
import type { RewardFormulaRow } from '../types/reward-formula.types';

interface Option { id: string; nome: string }
interface Props {
  rows: RewardFormulaRow[];
  categorias: Option[];
  bases: Option[];
  handlers: RewardFormulaRowHandlers;
  onGoCoverage: () => void;
}

export function RewardFormulasView({ rows, categorias, bases, handlers, onGoCoverage }: Props) {
  const state = useRewardFormulaFilters(rows);
  const summary = useMemo(() => computeFormulaSummary(rows), [rows]);

  if (rows.length === 0) {
    return <RewardFormulasEmptyState icon={Calculator} title="Nenhuma fórmula cadastrada" description="Cadastre fórmulas para configurar os pesos do cálculo das premiações." />;
  }

  return (
    <div className="space-y-[18px]">
      <RewardFormulasSummary summary={summary} onFilter={state.setFilters} onGoCoverage={onGoCoverage} />
      <SectionCard title="Fórmulas" description="Pesos, critérios e combinações usados no cálculo.">
        <div className="space-y-4">
          <RewardFormulasFilters
            filters={state.filters} onChange={state.setFilters} onReset={state.resetFilters}
            searchInput={state.searchInput} onSearchChange={state.setSearchInput} activeCount={state.activeCount}
            categorias={categorias} bases={bases}
          />
          <RewardFormulasTable rows={state.filtered} handlers={handlers} />
          <p className="text-xs text-muted-foreground">Mostrando {state.filtered.length} de {rows.length} fórmulas.</p>
        </div>
      </SectionCard>
    </div>
  );
}
