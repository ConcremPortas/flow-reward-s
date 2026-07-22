import { useMemo } from 'react';
import { Users, Link2, X } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { EmptyState } from '@/components/app/EmptyState';
import { Button } from '@/components/ui/button';
import { formatNumberBR } from '@/lib/formatters';
import { JobEmployeesFilters } from '../components/JobEmployeesFilters';
import { JobEmployeesTable } from '../components/JobEmployeesTable';
import { JobEmployeesPagination } from '../components/JobEmployeesPagination';
import type { EmployeeRowHandlers } from '../components/JobEmployeeActionsMenu';
import { filtrarColaboradores, ordenarColaboradores, paginar } from '../domain/employeeFilters';
import type { JobEmployeesData } from '../hooks/useJobEmployeesData';
import type { useJobEmployeeFilters } from '../hooks/useJobEmployeeFilters';
import type { JobEmployeeRow } from '../types/job-employee.types';

type FiltersState = ReturnType<typeof useJobEmployeeFilters>;

interface Props {
  data: JobEmployeesData;
  fs: FiltersState;
  handlers: EmployeeRowHandlers;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onTogglePage: (ids: string[], marcar: boolean) => void;
  onClearSelection: () => void;
  onBulkAssign: (rows: JobEmployeeRow[]) => void;
}

export function ColaboradoresView({ data, fs, handlers, selected, onToggle, onTogglePage, onClearSelection, onBulkAssign }: Props) {
  const filtrados = useMemo(() => ordenarColaboradores(filtrarColaboradores(data.rows, fs.filtros), fs.sort), [data.rows, fs.filtros, fs.sort]);
  const pageRows = useMemo(() => paginar(filtrados, fs.pagina, fs.porPagina), [filtrados, fs.pagina, fs.porPagina]);

  const selecionadosRows = useMemo(() => filtrados.filter((r) => selected.has(r.funcionario.id)), [filtrados, selected]);

  return (
    <SectionCard title="Colaboradores" description="Função (RH), cargo estruturado, setor e situação de enquadramento.">
      <div className="space-y-4">
        <JobEmployeesFilters
          filtros={fs.filtros} buscaInput={fs.buscaInput} onBusca={fs.setBuscaInput}
          empresas={data.empresas} setores={data.setores} funcoes={data.funcoesOptions} cargos={data.cargosOptions}
          autorizadoSalario={data.autorizadoSalario} ativos={fs.ativos}
          onChange={fs.setFiltros} onLimpar={fs.limpar}
        />

        {data.temCargos && selected.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/25 bg-primary/[0.04] px-3 py-2">
            <span className="text-sm text-foreground">{formatNumberBR(selected.size)} selecionado(s)</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => onBulkAssign(selecionadosRows)}><Link2 className="mr-1.5 h-4 w-4" /> Enquadrar selecionados</Button>
              <Button size="sm" variant="ghost" onClick={onClearSelection}><X className="mr-1.5 h-4 w-4" /> Limpar seleção</Button>
            </div>
          </div>
        )}

        {filtrados.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Nenhum colaborador no recorte atual"
            description={fs.ativos > 0 ? 'Nenhum colaborador corresponde aos filtros aplicados.' : 'Não há colaboradores para exibir.'}
            action={fs.ativos > 0 ? <Button variant="outline" size="sm" onClick={fs.limpar}>Limpar filtros</Button> : undefined}
          />
        ) : (
          <>
            <JobEmployeesTable
              rows={pageRows} temCargos={data.temCargos} sort={fs.sort} onSort={fs.setSort} handlers={handlers}
              selection={data.temCargos ? { selected, onToggle, onTogglePage } : undefined}
            />
            <JobEmployeesPagination total={filtrados.length} pagina={fs.pagina} porPagina={fs.porPagina} onPagina={fs.setPagina} onPorPagina={fs.setPorPagina} />
          </>
        )}
      </div>
    </SectionCard>
  );
}
