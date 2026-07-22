import { useMemo, useState } from 'react';
import { ListChecks, CalendarRange, Layers, Wallet, Clock, Database } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { EmployeesPagination } from '@/components/employees/EmployeesPagination';
import { formatCurrencyBRL } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import type { UseRewardsProcessingReturn } from '../hooks/useRewardsProcessing';
import { useRewardsProcessings } from '../hooks/useRewardsProcessings';
import { computeRewardsPreview } from '../domain/rewardsPreview';
import { compareBasePreview } from '../domain/rewardsComparison';
import { RewardsProcessingFilters } from '../components/RewardsProcessingFilters';
import { RewardsProcessingTable } from '../components/RewardsProcessingTable';
import { RewardsProcessingDrawer } from '../components/RewardsProcessingDrawer';
import { RewardsComparisonDialog } from '../components/RewardsComparisonDialog';
import { RewardsEmptyState } from '../components/RewardsEmptyState';
import type { ComparisonResult, ProcessingRow } from '../types/rewards-processing.types';
import type { ProcessingSeed } from './NewRewardsProcessingView';

interface Props {
  data: UseRewardsProcessingReturn;
  onReprocess: (seed: ProcessingSeed) => void;
  onOpenReport: (p?: { competencia?: string; baseId?: string }) => void;
}

export function RewardsProcessingsView({ data, onReprocess, onOpenReport }: Props) {
  const state = useRewardsProcessings(data.resultados, data.bases);
  const [drawerRow, setDrawerRow] = useState<ProcessingRow | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  const categorias = useMemo(() => [...new Set(state.rows.flatMap(r => r.categorias))].sort(), [state.rows]);

  const summary = useMemo(() => {
    const rows = state.filtered;
    const ultimo = rows.map(r => r.processadoEm).filter(Boolean).sort().slice(-1)[0] as string | undefined;
    return {
      processamentos: rows.length,
      competencias: new Set(rows.map(r => r.competencia)).size,
      bases: new Set(rows.map(r => r.baseId).filter(Boolean)).size,
      resultados: rows.reduce((s, r) => s + r.resultados, 0),
      valorTotal: rows.reduce((s, r) => s + r.valorTotal, 0),
      ultimo,
    };
  }, [state.filtered]);

  const doCompare = (row: ProcessingRow) => {
    const preview = computeRewardsPreview({ competencia: row.competencia, baseIds: [row.baseId], categoriaIds: [] }, data.previewInputs);
    const bp = preview.bases[0];
    if (bp) setComparison(compareBasePreview(bp, data.resultados, row.competencia));
  };

  const doDelete = async (row: ProcessingRow) => { await data.excluirResultados(row.competencia, row.baseId); };
  const doReprocess = (row: ProcessingRow) => onReprocess({ competencia: row.competencia, baseIds: [row.baseId], categoriaIds: [] });
  const doReport = (row: ProcessingRow) => onOpenReport({ competencia: row.competencia, baseId: row.baseId });

  return (
    <div className="space-y-[18px]">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Processamentos" value={String(summary.processamentos)} icon={ListChecks} />
        <StatCard title="Competências" value={String(summary.competencias)} icon={CalendarRange} />
        <StatCard title="Bases processadas" value={String(summary.bases)} icon={Layers} />
        <StatCard title="Resultados (vínculos)" value={String(summary.resultados)} hint="linhas processadas" icon={Database} />
        <StatCard title="Valor total" value={formatCurrencyBRL(summary.valorTotal)} icon={Wallet} />
        <StatCard title="Último processamento" value={summary.ultimo ? formatDateTimeBR(summary.ultimo) : '—'} icon={Clock} />
      </div>

      <SectionCard title="Processamentos" description="Cálculos de premiação salvos, por competência e base.">
        <div className="space-y-4">
          <RewardsProcessingFilters
            filters={state.filters} onChange={state.setFilters} searchInput={state.searchInput} onSearchChange={state.setSearchInput}
            bases={data.bases} categorias={categorias}
          />
          {state.rows.length === 0 ? (
            <RewardsEmptyState icon={ListChecks} title="Nenhum processamento salvo" description="Os processamentos aparecerão aqui após a confirmação em Novo Processamento." />
          ) : (
            <>
              <RewardsProcessingTable
                rows={state.paged}
                onOpenDrawer={setDrawerRow}
                onDetails={setDrawerRow}
                onEmployees={setDrawerRow}
                onCompare={doCompare}
                onReprocess={doReprocess}
                onReport={doReport}
                onDelete={doDelete}
              />
              <EmployeesPagination page={state.page} totalPages={state.totalPages} pageSize={state.pageSize} total={state.filtered.length} onPageChange={state.setPage} onPageSizeChange={state.setPageSize} />
            </>
          )}
        </div>
      </SectionCard>

      <RewardsProcessingDrawer row={drawerRow} resultados={data.resultados} onClose={() => setDrawerRow(null)} onReprocess={(r) => { setDrawerRow(null); doReprocess(r); }} onReport={doReport} />
      <RewardsComparisonDialog open={!!comparison} onOpenChange={(o) => { if (!o) setComparison(null); }} comparison={comparison} />
    </div>
  );
}
