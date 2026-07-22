import { useMemo, useState } from 'react';
import { EmptyState } from '@/components/app/EmptyState';
import { Users } from 'lucide-react';
import { EmployeesPagination } from '@/components/employees/EmployeesPagination';
import { EpiInspectionSummary } from './EpiInspectionSummary';
import { EpiInspectionFilters } from './EpiInspectionFilters';
import { EpiInspectionTable } from './EpiInspectionTable';
import { EpiSaveBar } from './EpiSaveBar';
import { EpiBulkBar } from './EpiBulkBar';
import type { UseEpiInspectionReturn } from '@/features/epi/hooks/useEpiInspection';
import { useComplianceFilters } from '@/features/epi/hooks/useEpiFilters';
import { useEmployeeSelection } from '@/features/employees/hooks/useEmployeeSelection';

interface Option { id: string; nome: string }

interface Props {
  inspection: UseEpiInspectionReturn;
  empresas: Option[];
  setores: Option[];
  onReview: () => void;
}

/** Etapa 2 — Inspeção. */
export function EpiInspectionStep({ inspection, empresas, setores, onReview }: Props) {
  const filtersState = useComplianceFilters(inspection.funcionarios, inspection.draft, inspection.baseline);
  const selection = useEmployeeSelection();
  const [filteringSelected, setFilteringSelected] = useState(false);

  const effectiveFiltered = useMemo(
    () => (filteringSelected ? filtersState.filtered.filter((f) => selection.isSelected(f.id)) : filtersState.filtered),
    [filteringSelected, filtersState.filtered, selection],
  );
  const effectiveTotalPages = Math.max(1, Math.ceil(effectiveFiltered.length / filtersState.pageSize));
  const effectivePage = Math.min(filtersState.page, effectiveTotalPages);
  const effectivePaged = effectiveFiltered.slice((effectivePage - 1) * filtersState.pageSize, effectivePage * filtersState.pageSize);

  if (inspection.funcionarios.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum funcionário ativo encontrado"
        description="Cadastre funcionários com status ativo para realizar a auditoria de EPI."
      />
    );
  }

  const selectedNaoConformes = [...selection.selected].some((id) => !(inspection.draft[id] ?? true));

  return (
    <div className="space-y-4">
      <EpiInspectionSummary
        auditados={inspection.funcionarios.length}
        conformes={inspection.conformes.length}
        naoConformes={inspection.naoConformes.length}
        taxaConformidade={inspection.taxaConformidade}
      />

      <EpiInspectionFilters
        searchInput={filtersState.searchInput}
        onSearchChange={filtersState.setSearchInput}
        filters={filtersState.filters}
        onChange={filtersState.setFilters}
        empresas={empresas}
        setores={setores}
        changedCount={inspection.diff.totalAlterados}
        onMarkAllConforme={inspection.markAllConforme}
        onRestore={inspection.restoreInitial}
      />

      <EpiBulkBar
        count={selection.count}
        hasNaoConformesSelected={selectedNaoConformes}
        filteringSelected={filteringSelected}
        onMarkConforme={() => { selection.selected.forEach((id) => inspection.setCompliance(id, true)); }}
        onRestore={() => { selection.selected.forEach((id) => inspection.setCompliance(id, inspection.baseline[id] ?? true)); }}
        onToggleFilterSelected={() => setFilteringSelected((v) => !v)}
        onClear={() => { selection.clear(); setFilteringSelected(false); }}
      />

      <EpiInspectionTable
        rows={effectivePaged}
        baseline={inspection.baseline}
        draft={inspection.draft}
        isSelected={selection.isSelected}
        onToggleSelect={selection.toggle}
        onToggleSelectAll={selection.toggleAll}
        onChangeCompliance={inspection.setCompliance}
      />

      <EmployeesPagination
        page={effectivePage}
        totalPages={effectiveTotalPages}
        pageSize={filtersState.pageSize}
        total={effectiveFiltered.length}
        onPageChange={filtersState.setPage}
        onPageSizeChange={filtersState.setPageSize}
      />

      <EpiSaveBar
        changedCount={inspection.diff.totalAlterados}
        conformes={inspection.conformes.length}
        naoConformes={inspection.naoConformes.length}
        onDiscard={inspection.restoreInitial}
        onReview={onReview}
      />
    </div>
  );
}
