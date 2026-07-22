import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { Button } from '@/components/ui/button';
import { useJobEmployeesData } from '../hooks/useJobEmployeesData';
import { useJobEmployeeFilters } from '../hooks/useJobEmployeeFilters';
import { normalizeJobEmployeesView } from '../views';
import type { JobEmployeesView, JobEmployeeRow, JobEmployeeFilters } from '../types/job-employee.types';
import { JobEmployeesHeader } from './JobEmployeesHeader';
import { JobEmployeesNavigation } from './JobEmployeesNavigation';
import { JobEmployeesContext } from './JobEmployeesContext';
import { JobEmployeesSetupAlert } from './JobEmployeesSetupAlert';
import { JobEmployeesSkeleton } from './JobEmployeesSkeleton';
import { JobEmployeeDrawer } from './JobEmployeeDrawer';
import { EmployeeJobAssignmentDialog } from './EmployeeJobAssignmentDialog';
import type { EmployeeRowHandlers } from './JobEmployeeActionsMenu';
import { ColaboradoresView } from '../pages/ColaboradoresView';
import { PendenciasView } from '../pages/PendenciasView';
import { RH_MASTER_ROUTE } from '../domain/employeeDataSource';

const CARGOS_ROUTE = '/cargos-salarios/cargos';

/**
 * Central de Enquadramento de Colaboradores — shell único (?view=colaboradores|
 * pendencias). Carrega os dados uma vez, deriva o modelo puro e orquestra:
 * lista paginada, pendências, mapeamento função→cargo, drawer e enquadramento
 * (individual/lote). Cadastro mestre e salário permanecem sob responsabilidade
 * do RH; nada é convertido automaticamente. Não altera banco/RLS nem o motor.
 */
export function JobEmployeesShell() {
  const data = useJobEmployeesData();
  const fs = useJobEmployeeFilters();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const view = normalizeJobEmployeesView(searchParams.get('view'));

  const [drawer, setDrawer] = useState<JobEmployeeRow | null>(null);
  const [assignTarget, setAssignTarget] = useState<JobEmployeeRow[] | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const setView = (v: JobEmployeesView) => { const sp = new URLSearchParams(searchParams); sp.set('view', v); setSearchParams(sp); };
  const aplicarFiltro = useCallback((patch: Partial<JobEmployeeFilters>) => { fs.setFiltros(patch); setView('colaboradores'); }, [fs]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback((id: string) => setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; }), []);
  const togglePage = useCallback((ids: string[], marcar: boolean) => setSelected((prev) => { const n = new Set(prev); ids.forEach((id) => { if (marcar) n.add(id); else n.delete(id); }); return n; }), []);
  const clearSelection = useCallback(() => setSelected(new Set()), []);

  const irParaRh = () => navigate(RH_MASTER_ROUTE);
  const verCargo = () => navigate(CARGOS_ROUTE);

  const handlers: EmployeeRowHandlers = {
    onOpen: setDrawer,
    onAssign: (r) => { setDrawer(null); setAssignTarget([r]); },
    onViewCargo: verCargo,
    onOpenRh: irParaRh,
    onHistory: setDrawer,
  };

  const enquadrarPorFuncao = useCallback((funcaoId: string) => {
    const alvos = data.rows.filter((r) => r.ativo && r.funcionario.funcao_id === funcaoId);
    if (alvos.length > 0) setAssignTarget(alvos);
  }, [data.rows]);

  const confirmarEnquadramento = async (cargo: { id: string }, alvos: JobEmployeeRow[], motivo: string) => {
    const hoje = new Date().toISOString().slice(0, 10);
    // Enquadramento em lote: um registro de histórico por colaborador (mutação
    // iniciada pelo usuário, não é consulta N+1). A função e o salário não mudam.
    for (const a of alvos) {
      await data.criarEnquadramento({
        funcionario_id: a.funcionario.id,
        cargo_id: cargo.id,
        cargo_anterior_id: a.cargo?.id,
        tipo_mudanca: a.cargo ? 'alteracao_cargo' : 'enquadramento',
        data_mudanca: hoje,
        motivo: motivo.trim() || undefined,
      });
    }
    setAssignTarget(null);
    clearSelection();
  };

  if (data.loading && data.rows.length === 0) return <JobEmployeesSkeleton />;

  if (data.error && data.rows.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        <JobEmployeesHeader onNovoFuncionario={irParaRh} />
        <SectionCard>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">Não foi possível carregar os colaboradores</p>
            <Button variant="outline" size="sm" onClick={() => data.refetch()}>Tentar novamente</Button>
          </div>
        </SectionCard>
      </div>
    );
  }

  const pendenciasCount = data.contexto.pendentes;

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-6">
      <JobEmployeesHeader onNovoFuncionario={irParaRh}>
        <JobEmployeesNavigation active={view} onChange={setView} pendencias={pendenciasCount} />
      </JobEmployeesHeader>

      {!data.temCargos && (
        <JobEmployeesSetupAlert
          colaboradoresAtivos={data.contexto.totalAtivos}
          onConfigurarCargo={() => navigate(CARGOS_ROUTE)}
          onAnalisarFuncoes={() => setView('pendencias')}
        />
      )}

      <JobEmployeesContext ctx={data.contexto} onQuickFilter={aplicarFiltro} />

      <div key={view} className="animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none">
        {view === 'pendencias' ? (
          <PendenciasView data={data} onAplicarFiltro={aplicarFiltro} onEnquadrarFuncao={enquadrarPorFuncao} />
        ) : (
          <ColaboradoresView
            data={data} fs={fs} handlers={handlers}
            selected={selected} onToggle={toggle} onTogglePage={togglePage} onClearSelection={clearSelection}
            onBulkAssign={(rows) => setAssignTarget(rows)}
          />
        )}
      </div>

      <JobEmployeeDrawer
        row={drawer} autorizadoSalario={data.autorizadoSalario} temCargos={data.temCargos} historico={data.historico}
        onClose={() => setDrawer(null)}
        onAssign={(r) => { setDrawer(null); setAssignTarget([r]); }}
        onViewCargo={verCargo} onOpenRh={irParaRh}
      />

      <EmployeeJobAssignmentDialog
        alvos={assignTarget} cargos={data.cargos} autorizadoSalario={data.autorizadoSalario} saving={false}
        onOpenChange={(o) => { if (!o) setAssignTarget(null); }}
        onConfirm={confirmarEnquadramento}
      />
    </div>
  );
}
