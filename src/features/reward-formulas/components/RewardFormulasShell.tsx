import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRewardFormulas } from '../hooks/useRewardFormulas';
import { normalizeRewardFormulasView } from '../views';
import type { RewardFormulasView as ViewKey } from '../types/reward-formula.types';
import { RewardFormulasHeader } from './RewardFormulasHeader';
import { RewardFormulasNavigation } from './RewardFormulasNavigation';
import { RewardFormulasSkeleton } from './RewardFormulasSkeleton';
import { RewardFormulaDrawer } from './RewardFormulaDrawer';
import { RewardFormulaEditor } from './RewardFormulaEditor';
import { RewardFormulaComparisonDialog } from './RewardFormulaComparisonDialog';
import { RewardFormulaDeleteDialog } from './RewardFormulaDeleteDialog';
import { RewardFormulasView } from '../pages/RewardFormulasView';
import { RewardFormulaCoverageView } from '../pages/RewardFormulaCoverageView';
import type { RewardFormulaRowHandlers } from './RewardFormulasTable';
import type { EditorInit } from '../hooks/useRewardFormulaEditor';
import type { CoverageCell, RewardFormulaRow } from '../types/reward-formula.types';

/**
 * Central de Fórmulas de Premiação — 2 visões (?view=formulas|cobertura). Shell
 * único: dados uma vez, hospeda editor (3 etapas), drawer, comparação e exclusão.
 * Consome o MESMO motor (prévia via calcularNotaGeral). Não altera o motor nem o
 * banco; exclusão soft, bloqueada quando em uso.
 */
export function RewardFormulasShell() {
  const data = useRewardFormulas();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = normalizeRewardFormulasView(searchParams.get('view'));

  const [drawer, setDrawer] = useState<RewardFormulaRow | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorInit, setEditorInit] = useState<EditorInit>({ editing: null });
  const [comparison, setComparison] = useState<RewardFormulaRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RewardFormulaRow | null>(null);
  const [seed, setSeed] = useState(0);

  const setView = (v: ViewKey) => { const sp = new URLSearchParams(searchParams); sp.set('view', v); setSearchParams(sp); };
  const nextSeed = () => { const s = seed + 1; setSeed(s); return String(s); };

  const openNova = () => { setEditorInit({ editing: null, seed: nextSeed() }); setEditorOpen(true); };
  const openEdit = (r: RewardFormulaRow) => { setDrawer(null); setComparison(null); setEditorInit({ editing: r, seed: nextSeed() }); setEditorOpen(true); };
  const openDuplicar = (r: RewardFormulaRow) => {
    setDrawer(null); setComparison(null);
    setEditorInit({ editing: null, presetWeights: r.weights, presetNome: `${r.nome} (cópia)`, presetDescricao: r.descricao ?? '', seed: nextSeed() });
    setEditorOpen(true);
  };
  const openCreateFor = (categoriaId: string, baseId: string) => {
    setEditorInit({ editing: null, presetCategoriaId: categoriaId, presetBaseId: baseId, seed: nextSeed() });
    setEditorOpen(true);
  };
  const openComparar = (r: RewardFormulaRow) => { setDrawer(null); setComparison(r); };

  const handlers: RewardFormulaRowHandlers = {
    onOpen: setDrawer, onEdit: openEdit, onDuplicar: openDuplicar, onComparar: openComparar,
    onVerUtilizacao: setDrawer, onDelete: setDeleteTarget,
  };

  const onCellClick = (cell: CoverageCell) => {
    if (cell.state === 'sem_formula') { openCreateFor(cell.categoriaId, cell.baseId); return; }
    if (cell.state === 'duplicada') { const a = data.rowById.get(cell.formulaIds[0]); if (a) setComparison(a); return; }
    const r = data.rowById.get(cell.formulaIds[0]); if (r) setDrawer(r);
  };

  if (data.loading && data.rows.length === 0) return <RewardFormulasSkeleton />;

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-[18px]">
      <RewardFormulasHeader onNovaFormula={openNova}>
        <RewardFormulasNavigation active={view} onChange={setView} />
      </RewardFormulasHeader>

      <div key={view} className="animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none">
        {view === 'cobertura' ? (
          <RewardFormulaCoverageView rows={data.rows} categorias={data.categoriaOptions} bases={data.baseOptions} onCellClick={onCellClick} />
        ) : (
          <RewardFormulasView rows={data.rows} categorias={data.categoriaOptions} bases={data.baseOptions} handlers={handlers} onGoCoverage={() => setView('cobertura')} />
        )}
      </div>

      <RewardFormulaDrawer
        row={drawer} onClose={() => setDrawer(null)}
        onEdit={openEdit} onDuplicar={openDuplicar} onComparar={openComparar} onVerUtilizacao={setDrawer}
      />

      <RewardFormulaEditor
        open={editorOpen} onOpenChange={setEditorOpen} init={editorInit}
        categorias={data.categoriaOptions} bases={data.baseOptions}
        findByCombo={data.findByCombo} copyableFormulas={data.rows}
        onCreate={async (payload) => { await data.createFormula(payload); }}
        onUpdate={async (id, payload) => { await data.updateFormula(id, payload); }}
        onOpenExisting={(r) => { setEditorOpen(false); setDrawer(r); }}
      />

      <RewardFormulaComparisonDialog
        a={comparison} all={data.rows}
        onOpenChange={(o) => { if (!o) setComparison(null); }}
        onEdit={openEdit} onDuplicar={openDuplicar}
      />

      <RewardFormulaDeleteDialog
        row={deleteTarget}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}
        onConfirm={async (r) => { await data.deleteFormula(r.id); }}
        onVerUtilizacao={setDrawer}
      />
    </div>
  );
}
