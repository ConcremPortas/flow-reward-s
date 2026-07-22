import { useState } from 'react';
import { SectionCard } from '@/components/app/SectionCard';
import { EmptyState } from '@/components/app/EmptyState';
import { History } from 'lucide-react';
import { EmployeesPagination } from '@/components/employees/EmployeesPagination';
import { EpiHistorySummary } from '../EpiHistorySummary';
import { EpiHistoryFilters } from '../EpiHistoryFilters';
import { EpiHistoryTable } from '../EpiHistoryTable';
import { EpiAuditDrawer } from '../EpiAuditDrawer';
import { useEpiHistoryFilters } from '@/features/epi/hooks/useEpiFilters';
import { generateSingleEpiReport, generatePeriodEpiReport } from '@/features/epi/domain/epiReport';
import { formatDateBR } from '@/lib/dateTime';
import type { EpiAuditGroupEnriched } from '@/features/epi/domain/epiCalculations';
import type { EpiPageProps } from './_shared';

export function EpiHistoryView({ data, audit, onGoToView }: EpiPageProps) {
  const [selectedGroup, setSelectedGroup] = useState<EpiAuditGroupEnriched | null>(null);

  const empresasOptions = data.empresas.map((e) => ({ id: e.id, nome: e.nome }));
  const setoresOptions = data.setores.map((s) => ({ id: s.id, nome: s.nome }));
  const filtersState = useEpiHistoryFilters(data.auditGroups);

  const handleReportRow = (group: EpiAuditGroupEnriched) => generateSingleEpiReport(group);

  const handlePeriodReport = () => {
    const sub = [
      filtersState.filters.dataInicial && `De ${formatDateBR(filtersState.filters.dataInicial)}`,
      filtersState.filters.dataFinal && `até ${formatDateBR(filtersState.filters.dataFinal)}`,
    ].filter(Boolean).join(' ') || 'Todo o período';
    generatePeriodEpiReport(filtersState.filtered, sub);
  };

  const handleEdit = (group: EpiAuditGroupEnriched) => {
    audit.startEdit(group);
    onGoToView('auditoria');
  };

  const handleDuplicate = (group: EpiAuditGroupEnriched) => {
    audit.startDuplicate(group);
    onGoToView('auditoria');
  };

  const handleDelete = async (group: EpiAuditGroupEnriched) => {
    await data.deleteManyEPI(group.memberRecordIds);
  };

  return (
    <div className="space-y-[18px]">
      <EpiHistorySummary rows={filtersState.filtered} />

      <SectionCard title="Histórico de Auditorias" description="Consulte, edite e gere relatórios das auditorias de EPI já realizadas">
        <div className="space-y-4">
          <EpiHistoryFilters
            searchInput={filtersState.searchInput}
            onSearchChange={filtersState.setSearchInput}
            filters={filtersState.filters}
            onChange={filtersState.setFilters}
            empresas={empresasOptions}
            setores={setoresOptions}
            onGenerateReport={handlePeriodReport}
            reportDisabled={filtersState.filtered.length === 0}
          />

          {data.auditGroups.length === 0 ? (
            <EmptyState icon={History} title="Nenhuma auditoria realizada ainda" description="As auditorias de EPI registradas aparecerão aqui." />
          ) : (
            <>
              <EpiHistoryTable
                rows={filtersState.paged}
                onOpenDetails={setSelectedGroup}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onGenerateReport={handleReportRow}
                onDelete={handleDelete}
              />
              <EmployeesPagination
                page={filtersState.page}
                totalPages={filtersState.totalPages}
                pageSize={filtersState.pageSize}
                total={filtersState.filtered.length}
                onPageChange={filtersState.setPage}
                onPageSizeChange={filtersState.setPageSize}
                pageSizeOptions={[10, 25, 50]}
              />
            </>
          )}
        </div>
      </SectionCard>

      <EpiAuditDrawer
        group={selectedGroup}
        onClose={() => setSelectedGroup(null)}
        onEdit={(group) => { setSelectedGroup(null); handleEdit(group); }}
        onGenerateReport={handleReportRow}
      />
    </div>
  );
}
