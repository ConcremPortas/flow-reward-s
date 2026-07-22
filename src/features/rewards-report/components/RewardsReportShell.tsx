import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText } from 'lucide-react';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import { useRewardsReport } from '../hooks/useRewardsReport';
import { useRewardsReportFilters } from '../hooks/useRewardsReportFilters';
import { useRewardsExport } from '../hooks/useRewardsExport';
import { computeTotals } from '../domain/rewardsReportMetrics';
import { normalizeReportView, type ReportView } from '../views';
import { RewardsReportHeader } from './RewardsReportHeader';
import { RewardsReportNavigation } from './RewardsReportNavigation';
import { RewardsReportFilters } from './RewardsReportFilters';
import { RewardsReportSkeleton } from './RewardsReportSkeleton';
import { RewardsReportEmptyState } from './RewardsReportEmptyState';
import { RewardCalculationDrawer } from './RewardCalculationDrawer';
import { RewardsExportDialog } from './RewardsExportDialog';
import { RewardsExecutiveSummaryView } from '../pages/RewardsExecutiveSummaryView';
import { RewardsEmployeeResultsView } from '../pages/RewardsEmployeeResultsView';
import { RewardsReconciliationView } from '../pages/RewardsReconciliationView';

/**
 * Central de Relatório de Premiações — 3 visões (?view=resumo|funcionarios|
 * conciliacao). Consome resultados persistidos; NÃO recalcula/processa. Filtros
 * globais persistem entre visões. Reutiliza a memória de cálculo do processamento.
 */
export function RewardsReportShell() {
  const data = useRewardsReport();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = normalizeReportView(searchParams.get('view'));

  const filters = useRewardsReportFilters(data.resultados, {
    competencia: searchParams.get('competencia') ?? undefined,
    baseId: searchParams.get('base') ?? searchParams.get('baseId') ?? undefined,
    categoria: searchParams.get('categoria') ?? undefined,
  });

  const [selected, setSelected] = useState<ResultadoPremiacao | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const setView = (v: ReportView) => { const sp = new URLSearchParams(searchParams); sp.set('view', v); setSearchParams(sp); };

  const baseNome = filters.filters.baseId !== 'todos' ? (data.bases.find(b => b.id === filters.filters.baseId)?.nome ?? null) : null;
  const totals = useMemo(() => computeTotals(filters.filteredAll), [filters.filteredAll]);
  const exportCtx = useMemo(() => ({ competencia: filters.filters.competencia, baseNome }), [filters.filters.competencia, baseNome]);
  const exporter = useRewardsExport(filters.filteredAll, exportCtx);

  const openById = (id: string) => { const r = filters.filteredAll.find(x => x.id === id); if (r) setSelected(r); };
  const filterBaseAndGo = (baseId: string) => { filters.setFilters({ baseId }); setView('funcionarios'); };
  const podeVerProcessamento = !!filters.filters.competencia && filters.filters.baseId !== 'todos';

  if (data.loading && data.resultados.length === 0) return <RewardsReportSkeleton />;

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-[18px]">
      <RewardsReportHeader
        onExport={() => setExportOpen(true)}
        onVerProcessamento={podeVerProcessamento ? () => navigate('/premiacoes/gerar-premiacoes?view=processamentos') : undefined}
      >
        <RewardsReportNavigation active={view} onChange={setView} />
      </RewardsReportHeader>

      <RewardsReportFilters
        filters={filters.filters} onChange={filters.setFilters} onCriterio={filters.setCriterio} onReset={filters.reset}
        searchInput={filters.searchInput} onSearchChange={filters.setSearchInput}
        bases={data.bases} categorias={data.categorias} setores={filters.setores} faixas={filters.faixas}
        activeCount={filters.activeCount}
      />

      {filters.filteredAll.length === 0 ? (
        <RewardsReportEmptyState icon={FileText} title="Nenhum resultado encontrado" description="Ajuste a competência, base, categoria ou busca para visualizar os resultados de premiação." />
      ) : (
        <div key={view} className="animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none">
          {view === 'funcionarios' ? (
            <RewardsEmployeeResultsView rows={filters.filteredAll} onOpenResult={setSelected} />
          ) : view === 'conciliacao' ? (
            <RewardsReconciliationView rows={filters.filteredAll} bases={data.bases} onOpenById={openById} />
          ) : (
            <RewardsExecutiveSummaryView rows={filters.filteredAll} bases={data.bases} onFilterBaseAndGo={filterBaseAndGo} />
          )}
        </div>
      )}

      <RewardCalculationDrawer result={selected} baseNome={baseNome ?? (selected ? data.bases.find(b => b.id === selected.base_premiacao_id)?.nome ?? null : null)} onClose={() => setSelected(null)} />
      <RewardsExportDialog open={exportOpen} onOpenChange={setExportOpen} scope={{ competencia: filters.filters.competencia, baseNome, categoria: filters.filters.categoria }} totals={totals} running={exporter.running} onRun={exporter.run} />
    </div>
  );
}
