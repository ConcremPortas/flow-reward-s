import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSectors } from '../hooks/useSectors';
import { normalizeSectorsView, type SectorsView as ViewKey } from '../views';
import { SectorsHeader } from './SectorsHeader';
import { SectorsNavigation } from './SectorsNavigation';
import { SectorsSkeleton } from './SectorsSkeleton';
import { SectorDrawer } from './SectorDrawer';
import { SectorForm, type SectorFormPayload } from './SectorForm';
import { SectorDeleteDialog } from './SectorDeleteDialog';
import { SectorsView } from '../pages/SectorsView';
import { LeadershipStructureView } from '../pages/LeadershipStructureView';
import type { SectorRowHandlers } from './SectorsTable';
import type { SectorRow } from '../types/sector.types';

/**
 * Central de Estrutura Organizacional — 2 visões (?view=setores|liderancas).
 * Shell único: carrega dados uma vez, hospeda drawer/formulário/exclusão e as
 * navegações de integração. A exclusão é soft (preservada). Não altera o banco.
 */
export function SectorsShell() {
  const data = useSectors();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = normalizeSectorsView(searchParams.get('view'));

  const [drawer, setDrawer] = useState<SectorRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SectorRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SectorRow | null>(null);

  const setView = (v: ViewKey) => { const sp = new URLSearchParams(searchParams); sp.set('view', v); setSearchParams(sp); };

  const openNovo = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (r: SectorRow) => { setDrawer(null); setEditing(r); setFormOpen(true); };

  // Integrações — navegam com ?setor= (destinos consomem o parâmetro).
  const verFuncionarios = (r: SectorRow) => navigate(`/premiacoes/funcionarios?setor=${r.id}`);
  const verProducao = (r: SectorRow) => navigate(`/premiacoes/producao-setor?setor=${r.id}`);
  const verIndicadores = (r: SectorRow) => navigate(`/premiacoes/indicadores-setor?setor=${r.id}`);

  const handlers: SectorRowHandlers = {
    onOpen: setDrawer, onEdit: openEdit, onFuncionarios: verFuncionarios,
    onProducao: verProducao, onIndicadores: verIndicadores, onDelete: setDeleteTarget,
  };

  const onCreate = async (payload: SectorFormPayload) => { await data.createSetor({ ...payload, ativo: true }); };
  const onUpdate = async (id: string, payload: SectorFormPayload) => { await data.updateSetor(id, payload); };

  if (data.loading && data.rows.length === 0) return <SectorsSkeleton />;

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-[18px]">
      <SectorsHeader onNovoSetor={openNovo}>
        <SectorsNavigation active={view} onChange={setView} />
      </SectorsHeader>

      <div key={view} className="animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none">
        {view === 'liderancas' ? (
          <LeadershipStructureView rows={data.rows} empresas={data.empresas} supervisores={data.supervisores} encarregados={data.encarregados} onOpenSetor={setDrawer} />
        ) : (
          <SectorsView rows={data.rows} empresas={data.empresas} supervisores={data.supervisores} encarregados={data.encarregados} handlers={handlers} />
        )}
      </div>

      <SectorDrawer row={drawer} onClose={() => setDrawer(null)} onEdit={openEdit} onFuncionarios={verFuncionarios} onProducao={verProducao} onIndicadores={verIndicadores} />

      <SectorForm
        open={formOpen} onOpenChange={setFormOpen} editing={editing}
        empresas={data.empresas} supervisores={data.supervisores} encarregados={data.encarregados}
        findDuplicate={data.findDuplicate} onCreate={onCreate} onUpdate={onUpdate}
        onOpenExisting={(r) => { setFormOpen(false); setDrawer(r); }}
      />

      <SectorDeleteDialog row={deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} onConfirm={async (r) => { await data.deleteSetor(r.id); }} onVerFuncionarios={verFuncionarios} />
    </div>
  );
}
