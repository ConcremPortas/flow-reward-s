import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useRewardBases } from '../hooks/useRewardBases';
import { normalizeRewardBasesView, type RewardBasesView as ViewKey } from '../views';
import { RewardBasesHeader } from './RewardBasesHeader';
import { RewardBasesNavigation } from './RewardBasesNavigation';
import { RewardBasesSkeleton } from './RewardBasesSkeleton';
import { RewardBaseDrawer } from './RewardBaseDrawer';
import { RewardBaseForm, type RewardBaseFormPayload } from './RewardBaseForm';
import { RewardBaseDeleteDialog } from './RewardBaseDeleteDialog';
import { RewardBasesView } from '../pages/RewardBasesView';
import { RewardBaseRelationsView } from '../pages/RewardBaseRelationsView';
import type { RewardBaseRowHandlers } from './RewardBasesTable';
import type { RewardBaseRow } from '../types/reward-base.types';

/**
 * Central de Bases de Premiação — 2 visões (?view=bases|utilizacao). Shell único:
 * carrega dados uma vez, hospeda drawer/formulário/exclusão e navegação contextual
 * para Relatório/Configurações de Kits. Exclusão soft, bloqueada com vínculos
 * ativos. Não altera o banco nem o motor.
 */
export function RewardBasesShell() {
  const data = useRewardBases();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = normalizeRewardBasesView(searchParams.get('view'));

  const [drawer, setDrawer] = useState<RewardBaseRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<RewardBaseRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RewardBaseRow | null>(null);

  const setView = (v: ViewKey) => { const sp = new URLSearchParams(searchParams); sp.set('view', v); setSearchParams(sp); };

  const openNova = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (r: RewardBaseRow) => { setDrawer(null); setEditing(r); setFormOpen(true); };
  const verVinculos = () => { setDrawer(null); setView('utilizacao'); };
  const verConfiguracoes = () => { navigate('/premiacoes/cadastros/configuracoes-kits'); };
  const verProcessamentos = () => { navigate('/premiacoes/relatorio-premiacoes'); };

  const handlers: RewardBaseRowHandlers = {
    onOpen: setDrawer, onEdit: openEdit, onVinculos: verVinculos,
    onConfiguracoes: verConfiguracoes, onProcessamentos: verProcessamentos, onDelete: setDeleteTarget,
  };

  const onCreate = async (payload: RewardBaseFormPayload) => { await data.createBase({ ...payload, ativo: true }); };
  const onUpdate = async (id: string, payload: RewardBaseFormPayload) => { await data.updateBase(id, payload); };

  if (data.loading && data.rows.length === 0) return <RewardBasesSkeleton />;

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-[18px]">
      <RewardBasesHeader onNovaBase={openNova}>
        <RewardBasesNavigation active={view} onChange={setView} />
      </RewardBasesHeader>

      <div key={view} className="animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none">
        {view === 'utilizacao' ? (
          <RewardBaseRelationsView rows={data.rows} totals={data.relationsTotals} onOpen={setDrawer} />
        ) : (
          <RewardBasesView rows={data.rows} handlers={handlers} />
        )}
      </div>

      <RewardBaseDrawer
        row={drawer} onClose={() => setDrawer(null)}
        onEdit={openEdit} onVinculos={verVinculos} onProcessamentos={verProcessamentos}
      />

      <RewardBaseForm
        open={formOpen} onOpenChange={setFormOpen} editing={editing}
        findDuplicate={data.findDuplicate} onCreate={onCreate} onUpdate={onUpdate}
        onOpenExisting={(r) => { setFormOpen(false); setDrawer(r); }}
      />

      <RewardBaseDeleteDialog
        row={deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        onConfirm={async (r) => { await data.deleteBase(r.id); }}
        onVinculos={verVinculos}
      />
    </div>
  );
}
