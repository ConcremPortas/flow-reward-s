import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { Button } from '@/components/ui/button';
import { useJobsData } from '../hooks/useJobsData';
import { useJobFilters } from '../hooks/useJobFilters';
import { normalizeJobsView } from '../views';
import type { JobsView, JobRow, JobFilters } from '../types/job.types';
import { JobsHeader } from './JobsHeader';
import { JobsNavigation } from './JobsNavigation';
import { JobsSkeleton } from './JobsSkeleton';
import { JobsSetupState } from './JobsSetupState';
import { JobDrawer } from './JobDrawer';
import { JobEditor } from './JobEditor';
import { JobActionDialog, type JobActionTarget } from './JobActionDialog';
import type { JobRowHandlers } from './JobActionsMenu';
import { ListaView } from '../pages/ListaView';
import { EstruturaView } from '../pages/EstruturaView';

/**
 * Central de Estrutura de Cargos — shell único (?view=lista|estrutura). Carrega
 * dados uma vez, deriva o modelo puro e apenas orquestra: lista, mapa, drawer,
 * editor em 3 etapas e diálogos de status/exclusão (com dependências reais).
 * Não altera banco/RLS nem o motor de premiação.
 */
export function JobsShell() {
  const data = useJobsData();
  const { filtros, setFiltros, limpar, ativos } = useJobFilters();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const view = normalizeJobsView(searchParams.get('view'));

  const [drawer, setDrawer] = useState<JobRow | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<JobRow | null>(null);
  const [editorStep, setEditorStep] = useState<1 | 2 | 3>(1);
  const [actionTarget, setActionTarget] = useState<JobActionTarget | null>(null);

  const setView = (v: JobsView) => {
    const sp = new URLSearchParams(searchParams);
    sp.set('view', v);
    setSearchParams(sp);
  };
  const goEstruturaComFiltro = (patch: Partial<JobFilters>) => { setFiltros(patch); setView('estrutura'); };

  const openNovo = () => { setEditing(null); setEditorStep(1); setEditorOpen(true); };
  const openEdit = (r: JobRow, step: 1 | 2 | 3 = 1) => { setDrawer(null); setEditing(r); setEditorStep(step); setEditorOpen(true); };
  const verColaboradores = () => { setDrawer(null); navigate('/cargos-salarios/funcionarios'); };

  const handlers: JobRowHandlers = {
    onOpen: setDrawer,
    onEdit: (r) => openEdit(r, 1),
    onViewEmployees: verColaboradores,
    onManageSalary: (r) => openEdit(r, 2),
    onActivate: (r) => { setDrawer(null); setActionTarget({ row: r, action: 'reativar' }); },
    onDeactivate: (r) => { setDrawer(null); setActionTarget({ row: r, action: 'inativar' }); },
    onDelete: (r) => { setDrawer(null); setActionTarget({ row: r, action: 'excluir' }); },
  };

  if (data.loading && data.model.rows.length === 0) return <JobsSkeleton />;

  if (data.error && data.model.rows.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        <JobsHeader onNovoCargo={openNovo} />
        <SectionCard>
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">Não foi possível carregar os cargos</p>
            <Button variant="outline" size="sm" onClick={() => data.refetch()}>Tentar novamente</Button>
          </div>
        </SectionCard>
      </div>
    );
  }

  const setoresOpt = data.setores.map((s) => ({ id: s.id, nome: s.nome }));

  // Módulo não implantado: estado guiado é o conteúdo primário (sem busca/tabela vazias).
  const conteudo = data.model.naoImplantado ? (
    <JobsSetupState
      colaboradoresAtivos={data.model.colaboradoresAtivos}
      setoresTotal={data.model.setoresTotal}
      niveisDistintos={data.model.niveisDistintos.length}
      funcoesDistintas={data.model.funcaoMapping.funcoesDistintas}
      onNovoCargo={openNovo}
      onAnalisarFuncoes={() => setView('estrutura')}
    />
  ) : view === 'estrutura' ? (
    <EstruturaView
      model={data.model} filtros={filtros} setores={data.setores}
      onSelectSetor={(setorId) => goEstruturaComFiltro({ setorId })}
      onSelectNivel={(nivel) => { setFiltros({ nivel }); setView('lista'); }}
    />
  ) : (
    <ListaView
      model={data.model} filtros={filtros} ativos={ativos} autorizadoSalario={data.autorizadoSalario}
      setores={setoresOpt} onChangeFiltros={setFiltros} onLimpar={limpar} handlers={handlers}
    />
  );

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-6">
      <JobsHeader onNovoCargo={openNovo}>
        {!data.model.naoImplantado && <JobsNavigation active={view} onChange={setView} />}
      </JobsHeader>

      <div key={data.model.naoImplantado ? 'setup' : view} className="animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none">
        {conteudo}
      </div>

      <JobDrawer
        row={drawer} autorizadoSalario={data.autorizadoSalario}
        enquadramentos={data.model.enquadramentos} historico={data.historico} estrutura={data.estrutura}
        onClose={() => setDrawer(null)} onEdit={(r) => openEdit(r, 1)} onViewEmployees={verColaboradores}
        onManageSalary={(r) => openEdit(r, 2)}
        onActivate={(r) => { setDrawer(null); setActionTarget({ row: r, action: 'reativar' }); }}
        onDeactivate={(r) => { setDrawer(null); setActionTarget({ row: r, action: 'inativar' }); }}
      />

      <JobEditor
        open={editorOpen} onOpenChange={setEditorOpen} editing={editing}
        setores={setoresOpt} cargos={data.model.rows.map((r) => r.cargo)} autorizadoSalario={data.autorizadoSalario}
        saving={data.saving} initialStep={editorStep}
        onCreate={data.createCargo} onUpdate={data.updateCargo}
      />

      <JobActionDialog
        target={actionTarget} enquadramentos={data.model.enquadramentos} historico={data.historico} estrutura={data.estrutura}
        saving={data.saving} onOpenChange={(o) => { if (!o) setActionTarget(null); }}
        onConfirm={async (t) => {
          if (t.action === 'inativar') await data.setAtivo(t.row.cargo.id, false);
          else if (t.action === 'reativar') await data.setAtivo(t.row.cargo.id, true);
          else await data.deleteCargo(t.row.cargo.id);
          setActionTarget(null);
        }}
      />
    </div>
  );
}
