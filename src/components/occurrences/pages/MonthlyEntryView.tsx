import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EmptyState } from '@/components/app/EmptyState';
import { Users } from 'lucide-react';
import { OccurrencesSummary, type OccurrencesSummaryCounts } from '../OccurrencesSummary';
import { OccurrencesFilters } from '../OccurrencesFilters';
import { OccurrencesBulkBar } from '../OccurrencesBulkBar';
import { OccurrencesTable } from '../OccurrencesTable';
import { OccurrencesSaveBar } from '../OccurrencesSaveBar';
import { OccurrencesReviewDialog } from '../OccurrencesReviewDialog';
import { EmployeesPagination } from '@/components/employees/EmployeesPagination';
import type { OccurrencePageProps } from './_shared';

const STATUS_OPTIONS = ['Ativo', 'Férias', 'Licença', 'Rescisão'];

export function MonthlyEntryView({ data, draft, filtersState, selection }: OccurrencePageProps) {
  const [reviewOpen, setReviewOpen] = useState(false);
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const setoresOptions = data.setores.map((s) => ({ id: s.id, nome: s.nome }));
  const categoriasOptions = data.categorias.map((c) => ({ id: c.id, nome: c.nome }));

  const counts: OccurrencesSummaryCounts = {
    funcionariosAtivos: data.funcionariosAtivos.length,
    funcionariosComFaltas: Object.values(draft.draft).filter((e) => e.faltas > 0).length,
    totalFaltas: Object.values(draft.draft).reduce((a, e) => a + e.faltas, 0),
    funcionariosAdvertidos: Object.values(draft.draft).filter((e) => e.advertencias > 0).length,
    totalAdvertencias: Object.values(draft.draft).reduce((a, e) => a + e.advertencias, 0),
    registrosAlterados: draft.diff.totalFuncionariosAlterados,
  };

  const handleSummaryClick = (key: keyof OccurrencesSummaryCounts) => {
    filtersState.resetFilters();
    if (key === 'funcionariosComFaltas') filtersState.setFilters({ tipo: 'falta', somenteComOcorrencia: true });
    else if (key === 'funcionariosAdvertidos') filtersState.setFilters({ tipo: 'advertencia', somenteComOcorrencia: true });
    else if (key === 'totalFaltas') filtersState.setFilters({ tipo: 'falta', somenteComOcorrencia: true });
    else if (key === 'totalAdvertencias') filtersState.setFilters({ tipo: 'advertencia', somenteComOcorrencia: true });
    else if (key === 'registrosAlterados') filtersState.setFilters({ somenteAlterados: true });
  };

  const selectedIds = [...selection.selected];
  const pageIds = filtersState.paged.map((f) => f.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selection.isSelected(id));

  const runBulk = (fn: () => void) => { setBulkBusy(true); try { fn(); } finally { setBulkBusy(false); selection.clear(); } };

  return (
    <div className="space-y-[18px]">
      <OccurrencesSummary counts={counts} onFilterClick={handleSummaryClick} />

      <OccurrencesFilters
        searchInput={filtersState.searchInput}
        onSearchChange={filtersState.setSearchInput}
        filters={filtersState.filters}
        onChange={filtersState.setFilters}
        onReset={filtersState.resetFilters}
        activeFilterCount={filtersState.activeFilterCount}
        setores={setoresOptions}
        categorias={categoriasOptions}
        statusOptions={STATUS_OPTIONS}
      />

      <OccurrencesBulkBar
        count={selection.count}
        busy={bulkBusy}
        onSetFaltas={(v) => runBulk(() => draft.bulkSetFaltas(selectedIds, v))}
        onSetAdvertencias={(v) => runBulk(() => draft.bulkSetAdvertencias(selectedIds, v))}
        onAdd={(f, a) => runBulk(() => draft.bulkAdd(selectedIds, f, a))}
        onZerar={() => runBulk(() => draft.bulkZerar(selectedIds))}
        onClear={selection.clear}
      />

      {filtersState.filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={data.funcionariosAtivos.length === 0 ? 'Nenhum funcionário ativo encontrado' : 'Nenhum funcionário encontrado'}
          description="Ajuste a busca ou os filtros para visualizar os funcionários desta competência."
        />
      ) : (
        <>
          <OccurrencesTable
            rows={filtersState.paged}
            baseline={draft.baseline}
            draft={draft.draft}
            isSelected={selection.isSelected}
            onToggleSelect={selection.toggle}
            onToggleAll={() => selection.toggleAll(pageIds)}
            allSelected={allPageSelected}
            onChangeFaltas={(id, v) => draft.setEntry(id, 'faltas', v)}
            onChangeAdvertencias={(id, v) => draft.setEntry(id, 'advertencias', v)}
            onRestore={draft.restoreEntry}
          />
          <EmployeesPagination
            page={filtersState.page}
            totalPages={filtersState.totalPages}
            pageSize={filtersState.pageSize}
            total={filtersState.filtered.length}
            onPageChange={filtersState.setPage}
            onPageSizeChange={filtersState.setPageSize}
          />
        </>
      )}

      <OccurrencesSaveBar
        changedCount={draft.diff.totalFuncionariosAlterados}
        totalFaltasDelta={draft.diff.totalFaltasDelta}
        totalAdvertenciasDelta={draft.diff.totalAdvertenciasDelta}
        saving={draft.saving}
        onDiscard={() => setDiscardConfirm(true)}
        onReview={() => setReviewOpen(true)}
        onSave={draft.save}
      />

      <OccurrencesReviewDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        diff={draft.diff}
        funcionarios={data.funcionariosAtivos}
        saving={draft.saving}
        onConfirmSave={async () => { const ok = await draft.save(); if (ok) setReviewOpen(false); }}
      />

      <AlertDialog open={discardConfirm} onOpenChange={setDiscardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações não salvas?</AlertDialogTitle>
            <AlertDialogDescription>
              {draft.diff.totalFuncionariosAlterados} funcionário(s) voltarão ao último valor salvo desta competência. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={() => { draft.restoreAll(); setDiscardConfirm(false); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
