import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { EmployeesPagination } from '@/components/employees/EmployeesPagination';
import type { Empresa } from '@/hooks/useEmpresas';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { useSectorFilters } from '../hooks/useSectorFilters';
import { computeSummary } from '../domain/sectorFilters';
import { SectorsSummary } from '../components/SectorsSummary';
import { SectorsTabs } from '../components/SectorsTabs';
import { SectorsFilters } from '../components/SectorsFilters';
import { SectorsTable, type SectorRowHandlers } from '../components/SectorsTable';
import { SectorsEmptyState } from '../components/SectorsEmptyState';
import type { SectorRow } from '../types/sector.types';

interface Props {
  rows: SectorRow[];
  empresas: Empresa[];
  supervisores: Funcionario[];
  encarregados: Funcionario[];
  handlers: SectorRowHandlers;
}

export function SectorsView({ rows, empresas, supervisores, encarregados, handlers }: Props) {
  const state = useSectorFilters(rows);
  const summary = useMemo(() => computeSummary(rows), [rows]);

  // Integração vinda de Empresas ("Ver setores"): pré-aplica o filtro de empresa.
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const empresaId = searchParams.get('empresa');
    if (empresaId) state.setFilters({ empresaId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (rows.length === 0) {
    return <SectorsEmptyState icon={Building2} title="Nenhum setor cadastrado" description="Cadastre setores para organizar a estrutura da empresa." />;
  }

  return (
    <div className="space-y-[18px]">
      <SectorsSummary summary={summary} onFilter={state.setFilters} />

      <SectionCard title="Setores" description="Gestão dos setores, lideranças e vínculos.">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectorsTabs tab={state.tab} onChange={state.setTab} counts={state.counts} />
          </div>
          <SectorsFilters
            filters={state.filters} onChange={state.setFilters} onReset={state.resetFilters}
            searchInput={state.searchInput} onSearchChange={state.setSearchInput}
            empresas={empresas} supervisores={supervisores} encarregados={encarregados} activeCount={state.activeCount}
          />
          <SectorsTable rows={state.paged} handlers={handlers} />
          <EmployeesPagination page={state.page} totalPages={state.totalPages} pageSize={state.pageSize} total={state.filtered.length} onPageChange={state.setPage} onPageSizeChange={state.setPageSize} />
        </div>
      </SectionCard>
    </div>
  );
}
