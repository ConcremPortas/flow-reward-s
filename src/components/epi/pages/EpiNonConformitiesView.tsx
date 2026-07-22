import { useMemo, useState } from 'react';
import { SectionCard } from '@/components/app/SectionCard';
import { EmptyState } from '@/components/app/EmptyState';
import { AlertTriangle } from 'lucide-react';
import { EmployeesPagination } from '@/components/employees/EmployeesPagination';
import { EpiNonConformitiesSummary } from '../EpiNonConformitiesSummary';
import { EpiNonConformityFilters } from '../EpiNonConformityFilters';
import { EpiNonConformitiesTable } from '../EpiNonConformitiesTable';
import { EpiNonConformityDrawer } from '../EpiNonConformityDrawer';
import { useNonConformityFilters } from '@/features/epi/hooks/useEpiFilters';
import { buildEmployeeTimelines, buildNonConformityRows, type EmployeeTimeline } from '@/features/epi/domain/epiRecurrence';
import { computeNonConformitySummary } from '@/features/epi/domain/epiCalculations';
import type { EpiNonConformityRow } from '@/features/epi/types/epi.types';
import type { EpiPageProps } from './_shared';

export function EpiNonConformitiesView({ data }: EpiPageProps) {
  const [selectedRow, setSelectedRow] = useState<EpiNonConformityRow | null>(null);

  const timelines = useMemo(() => buildEmployeeTimelines(data.auditGroups), [data.auditGroups]);
  const timelinesByKey = useMemo(() => new Map(timelines.map((t) => [t.key, t])), [timelines]);
  const rows = useMemo(() => buildNonConformityRows(timelines, data.funcionariosById), [timelines, data.funcionariosById]);

  const empresasOptions = data.empresas.map((e) => ({ id: e.id, nome: e.nome }));
  const setoresOptions = data.setores.map((s) => ({ id: s.id, nome: s.nome }));

  const filtersState = useNonConformityFilters(rows);
  const summary = useMemo(
    () => computeNonConformitySummary(data.auditGroups, filtersState.filters.dataInicial, filtersState.filters.dataFinal),
    [data.auditGroups, filtersState.filters.dataInicial, filtersState.filters.dataFinal],
  );

  const selectedTimeline: EmployeeTimeline | null = selectedRow
    ? timelinesByKey.get(selectedRow.funcionarioId ?? `legacy-name:${selectedRow.nome.toLowerCase()}`) ?? null
    : null;

  return (
    <div className="space-y-[18px]">
      <EpiNonConformitiesSummary rows={filtersState.filtered} summary={summary} />

      <SectionCard title="Não Conformidades de EPI" description="Funcionários com ao menos uma ocorrência de não conformidade">
        <div className="space-y-4">
          <EpiNonConformityFilters
            searchInput={filtersState.searchInput}
            onSearchChange={filtersState.setSearchInput}
            filters={filtersState.filters}
            onChange={filtersState.setFilters}
            empresas={empresasOptions}
            setores={setoresOptions}
          />

          {rows.length === 0 ? (
            <EmptyState icon={AlertTriangle} title="Nenhuma não conformidade registrada" description="Ótimo sinal — nenhuma auditoria encontrou não conformidades até agora." />
          ) : (
            <>
              <EpiNonConformitiesTable rows={filtersState.paged} onOpenDetails={setSelectedRow} />
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
        </div>
      </SectionCard>

      <EpiNonConformityDrawer timeline={selectedTimeline} funcionariosById={data.funcionariosById} onClose={() => setSelectedRow(null)} />
    </div>
  );
}
