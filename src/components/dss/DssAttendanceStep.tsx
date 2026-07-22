import { EmptyState } from '@/components/app/EmptyState';
import { Users } from 'lucide-react';
import { EmployeesPagination } from '@/components/employees/EmployeesPagination';
import { DssAttendanceSummary } from './DssAttendanceSummary';
import { DssAttendanceFilters } from './DssAttendanceFilters';
import { DssAttendanceTable } from './DssAttendanceTable';
import type { UseDssAttendanceReturn } from '@/features/dss/hooks/useDssAttendance';
import { useAttendanceFilters } from '@/features/dss/hooks/useDssFilters';

interface Option { id: string; nome: string }

interface Props {
  attendance: UseDssAttendanceReturn;
  setores: Option[];
}

/** Etapa 2 — Lista de Presença. */
export function DssAttendanceStep({ attendance, setores }: Props) {
  const filtersState = useAttendanceFilters(attendance.vinculados, attendance.draft);

  if (attendance.vinculados.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="Nenhum funcionário vinculado a este local"
        description="Cadastre o vínculo do funcionário ao local de DSS antes de registrar a presença."
      />
    );
  }

  return (
    <div className="space-y-4">
      <DssAttendanceSummary
        vinculados={attendance.vinculados.length}
        presentes={attendance.presentes.length}
        ausentes={attendance.ausentes.length}
        participacaoPct={attendance.participacaoPct}
      />

      <DssAttendanceFilters
        searchInput={filtersState.searchInput}
        onSearchChange={filtersState.setSearchInput}
        filters={filtersState.filters}
        onChange={filtersState.setFilters}
        setores={setores}
        changedCount={attendance.diff.totalAlterados}
        onMarkAllPresent={attendance.markAllPresent}
        onMarkAllAbsent={attendance.markAllAbsent}
        onRestore={attendance.restoreInitial}
      />

      <DssAttendanceTable
        rows={filtersState.paged}
        baseline={attendance.baseline}
        draft={attendance.draft}
        onChangePresence={attendance.setPresence}
      />

      <EmployeesPagination
        page={filtersState.page}
        totalPages={filtersState.totalPages}
        pageSize={filtersState.pageSize}
        total={filtersState.filtered.length}
        onPageChange={filtersState.setPage}
        onPageSizeChange={filtersState.setPageSize}
      />
    </div>
  );
}
