import { useMemo, useState } from 'react';
import { SectionCard } from '@/components/app/SectionCard';
import { EmptyState } from '@/components/app/EmptyState';
import { History } from 'lucide-react';
import { EmployeesPagination } from '@/components/employees/EmployeesPagination';
import { DssHistorySummary } from '../DssHistorySummary';
import { DssHistoryFilters } from '../DssHistoryFilters';
import { DssHistoryTable } from '../DssHistoryTable';
import { DssDetailsDrawer } from '../DssDetailsDrawer';
import { useDssHistoryFilters } from '@/features/dss/hooks/useDssFilters';
import { buildHistoryRows } from '@/features/dss/domain/dssCalculations';
import { generateSingleDssReport, generatePeriodDssReport } from '@/features/dss/domain/dssReport';
import { linkedActiveFuncionarios } from '@/features/dss/domain/dssValidation';
import type { DssHistoryRow } from '@/features/dss/types';
import type { DSS } from '@/hooks/useDSS';
import type { DssPageProps } from './_shared';

export function DssHistoryView({ data, registration, onGoToView }: DssPageProps) {
  const [selectedDss, setSelectedDss] = useState<DSS | null>(null);

  const rows = useMemo(() => buildHistoryRows(data.dssRecords, data.funcionarios), [data.dssRecords, data.funcionarios]);
  const filtersState = useDssHistoryFilters(rows);

  const findDss = (row: DssHistoryRow) => data.dssRecords.find((d) => d.id === row.id) || null;

  const handleReportRow = (row: DssHistoryRow) => {
    const dss = findDss(row);
    if (!dss) return;
    const vinculados = dss.local_dss_id ? linkedActiveFuncionarios(data.funcionarios, dss.local_dss_id) : [];
    const ids = new Set(dss.participantes_ids || []);
    generateSingleDssReport({
      titulo: dss.titulo,
      localNome: dss.local_dss?.nome || row.localNome || 'Local não informado',
      dataRealizacao: dss.data_realizacao,
      presentes: vinculados.filter((f) => ids.has(f.id)),
      ausentes: vinculados.filter((f) => !ids.has(f.id)),
    });
  };

  const handlePeriodReport = () => {
    const sub = [
      filtersState.filters.competenciaInicial && `De ${filtersState.filters.competenciaInicial}`,
      filtersState.filters.competenciaFinal && `até ${filtersState.filters.competenciaFinal}`,
    ].filter(Boolean).join(' ') || 'Todo o período';
    generatePeriodDssReport(filtersState.filtered, sub);
  };

  const handleEdit = (row: DssHistoryRow) => {
    const dss = findDss(row);
    if (!dss) return;
    registration.startEdit(dss);
    onGoToView('registro');
  };

  const handleDuplicate = (row: DssHistoryRow) => {
    const dss = findDss(row);
    if (!dss) return;
    registration.startDuplicate(dss);
    onGoToView('registro');
  };

  return (
    <div className="space-y-[18px]">
      <DssHistorySummary rows={filtersState.filtered} />

      <SectionCard title="Histórico de DSS" description="Consulte, edite e gere relatórios dos DSS já realizados">
        <div className="space-y-4">
          <DssHistoryFilters
            searchInput={filtersState.searchInput}
            onSearchChange={filtersState.setSearchInput}
            filters={filtersState.filters}
            onChange={filtersState.setFilters}
            locais={data.locaisDSS}
            onGenerateReport={handlePeriodReport}
            reportDisabled={filtersState.filtered.length === 0}
          />

          {rows.length === 0 ? (
            <EmptyState icon={History} title="Nenhum DSS realizado ainda" description="Os DSS registrados aparecerão aqui." />
          ) : (
            <>
              <DssHistoryTable
                rows={filtersState.paged}
                onOpenDetails={(row) => setSelectedDss(findDss(row))}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onGenerateReport={handleReportRow}
                onDelete={async (row) => { await data.deleteDSS(row.id); }}
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

      <DssDetailsDrawer
        dss={selectedDss}
        funcionarios={data.funcionarios}
        onClose={() => setSelectedDss(null)}
        onEdit={(dss) => { setSelectedDss(null); registration.startEdit(dss); onGoToView('registro'); }}
        onGenerateReport={(dss) => {
          const vinculados = dss.local_dss_id ? linkedActiveFuncionarios(data.funcionarios, dss.local_dss_id) : [];
          const ids = new Set(dss.participantes_ids || []);
          generateSingleDssReport({
            titulo: dss.titulo, localNome: dss.local_dss?.nome || 'Local não informado', dataRealizacao: dss.data_realizacao,
            presentes: vinculados.filter((f) => ids.has(f.id)), ausentes: vinculados.filter((f) => !ids.has(f.id)),
          });
        }}
      />
    </div>
  );
}
