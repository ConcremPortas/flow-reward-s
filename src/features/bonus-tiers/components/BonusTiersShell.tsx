import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useBonusTiers } from '../hooks/useBonusTiers';
import { normalizeBonusTiersView, type BonusTiersView as ViewKey } from '../views';
import { BonusTiersHeader } from './BonusTiersHeader';
import { BonusTiersNavigation } from './BonusTiersNavigation';
import { BonusTiersSkeleton } from './BonusTiersSkeleton';
import { BonusTierDrawer } from './BonusTierDrawer';
import { BonusTierForm, type TierFormPayload } from './BonusTierForm';
import { BonusTierDeleteDialog } from './BonusTierDeleteDialog';
import { BonusTiersView } from '../pages/BonusTiersView';
import { BonusTierRelationsView } from '../pages/BonusTierRelationsView';
import type { BonusTierRowHandlers } from './BonusTiersTable';
import type { BonusTierRow } from '../types/bonus-tier.types';

/**
 * Central de Faixas de Premiação — 2 visões (?view=faixas|vinculos). Shell único:
 * carrega dados uma vez, hospeda drawer/formulário/exclusão. Exclusão é soft.
 * Não altera o banco nem o motor de premiação.
 */
export function BonusTiersShell() {
  const data = useBonusTiers();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = normalizeBonusTiersView(searchParams.get('view'));

  const [drawer, setDrawer] = useState<BonusTierRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BonusTierRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BonusTierRow | null>(null);

  const setView = (v: ViewKey) => { const sp = new URLSearchParams(searchParams); sp.set('view', v); setSearchParams(sp); };

  const openNova = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (r: BonusTierRow) => { setDrawer(null); setEditing(r); setFormOpen(true); };
  const verVinculos = () => { setDrawer(null); setView('vinculos'); };

  const handlers: BonusTierRowHandlers = {
    onOpen: setDrawer, onEdit: openEdit, onVinculos: verVinculos, onDelete: setDeleteTarget,
  };

  const onCreate = async (payload: TierFormPayload) => { await data.createFaixa({ ...payload, ativo: true }); };
  const onUpdate = async (id: string, payload: TierFormPayload) => { await data.updateFaixa(id, payload); };

  if (data.loading && data.rows.length === 0) return <BonusTiersSkeleton />;

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-[18px]">
      <BonusTiersHeader onNovaFaixa={openNova}>
        <BonusTiersNavigation active={view} onChange={setView} />
      </BonusTiersHeader>

      <div key={view} className="animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none">
        {view === 'vinculos' ? (
          <BonusTierRelationsView rows={data.rows} totals={data.relationsTotals} onOpen={setDrawer} />
        ) : (
          <BonusTiersView rows={data.rows} handlers={handlers} />
        )}
      </div>

      <BonusTierDrawer row={drawer} onClose={() => setDrawer(null)} onEdit={openEdit} onVinculos={verVinculos} />

      <BonusTierForm
        open={formOpen} onOpenChange={setFormOpen} editing={editing}
        findDuplicate={data.findDuplicate} onCreate={onCreate} onUpdate={onUpdate}
        onOpenExisting={(r) => { setFormOpen(false); setDrawer(r); }}
      />

      <BonusTierDeleteDialog row={deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }} onConfirm={async (r) => { await data.deleteFaixa(r.id); }} />
    </div>
  );
}
