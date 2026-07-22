import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFunctions } from '../hooks/useFunctions';
import { normalizeFunctionsView, type FunctionsView as ViewKey } from '../views';
import { FunctionsHeader } from './FunctionsHeader';
import { FunctionsNavigation } from './FunctionsNavigation';
import { FunctionsSkeleton } from './FunctionsSkeleton';
import { FunctionDrawer } from './FunctionDrawer';
import { FunctionForm, type FunctionFormPayload } from './FunctionForm';
import { FunctionDeleteDialog } from './FunctionDeleteDialog';
import { FunctionComparisonDialog, type ComparisonPair } from './FunctionComparisonDialog';
import { FunctionsView } from '../pages/FunctionsView';
import { FunctionsStandardizationView } from '../pages/FunctionsStandardizationView';
import type { FunctionRowHandlers } from './FunctionsTable';
import type { FunctionRow } from '../types/function.types';

/**
 * Central de Funções — 2 visões (?view=funcoes|padronizacao). Shell único:
 * carrega dados uma vez, hospeda drawer/formulário/exclusão/comparação e a
 * navegação para Funcionários. Exclusão é soft e bloqueada com vínculos ativos.
 * Não altera o banco nem o motor de premiação.
 */
export function FunctionsShell() {
  const data = useFunctions();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = normalizeFunctionsView(searchParams.get('view'));

  const [drawer, setDrawer] = useState<FunctionRow | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FunctionRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FunctionRow | null>(null);
  const [comparison, setComparison] = useState<ComparisonPair | null>(null);

  const setView = (v: ViewKey) => { const sp = new URLSearchParams(searchParams); sp.set('view', v); setSearchParams(sp); };

  const openNova = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (r: FunctionRow) => { setDrawer(null); setComparison(null); setEditing(r); setFormOpen(true); };
  const verFuncionarios = (r: FunctionRow) => { navigate(`/premiacoes/funcionarios?funcao=${encodeURIComponent(r.id)}`); };

  const compareRows = (a: FunctionRow, b: FunctionRow) => { setDrawer(null); setComparison({ a, b }); };
  const compareById = (idA: string, idB: string) => {
    const a = data.rowById.get(idA); const b = data.rowById.get(idB);
    if (a && b) compareRows(a, b);
  };
  // "Comparar nomenclatura" a partir de uma linha: compara com a correspondência mais forte.
  const compareRow = (r: FunctionRow) => {
    const target = r.similar[0] ? data.rowById.get(r.similar[0].targetId) : undefined;
    if (target) compareRows(r, target);
    else setDrawer(r);
  };

  const handlers: FunctionRowHandlers = {
    onOpen: setDrawer, onEdit: openEdit, onVerFuncionarios: verFuncionarios, onCompare: compareRow, onDelete: setDeleteTarget,
  };

  const onCreate = async (payload: FunctionFormPayload) => { await data.createFuncao({ nome: payload.nome, ativo: true }); };
  const onUpdate = async (id: string, payload: FunctionFormPayload) => { await data.updateFuncao(id, { nome: payload.nome }); };

  if (data.loading && data.rows.length === 0) return <FunctionsSkeleton />;

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-[18px]">
      <FunctionsHeader onNovaFuncao={openNova}>
        <FunctionsNavigation active={view} onChange={setView} />
      </FunctionsHeader>

      <div key={view} className="animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none">
        {view === 'padronizacao' ? (
          <FunctionsStandardizationView
            rows={data.rows}
            similarityGroups={data.similarityGroups}
            relationsTotals={data.relationsTotals}
            onOpen={setDrawer}
            onCompare={compareById}
          />
        ) : (
          <FunctionsView rows={data.rows} grupos={data.similarityGroups.length} setores={data.setorOptions} handlers={handlers} />
        )}
      </div>

      <FunctionDrawer row={drawer} onClose={() => setDrawer(null)} onEdit={openEdit} onVerFuncionarios={verFuncionarios} onCompare={compareRow} />

      <FunctionForm
        open={formOpen} onOpenChange={setFormOpen} editing={editing}
        findDuplicate={data.findDuplicate} findSimilar={data.findSimilar}
        onCreate={onCreate} onUpdate={onUpdate}
        onOpenExisting={(r) => { setFormOpen(false); setDrawer(r); }}
      />

      <FunctionDeleteDialog
        row={deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        onConfirm={async (r) => { await data.deleteFuncao(r.id); }}
        onVerFuncionarios={verFuncionarios}
      />

      <FunctionComparisonDialog
        pair={comparison}
        onOpenChange={(o) => { if (!o) setComparison(null); }}
        onEdit={openEdit}
        onVerFuncionarios={verFuncionarios}
      />
    </div>
  );
}
