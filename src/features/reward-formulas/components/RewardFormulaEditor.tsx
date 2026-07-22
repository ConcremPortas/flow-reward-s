import { useMemo, useState } from 'react';
import { Loader2, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { isValidFormulaName } from '../domain/rewardFormulaValidation';
import { useRewardFormulaEditor, type EditorInit } from '../hooks/useRewardFormulaEditor';
import { RewardFormulaApplicationStep } from './RewardFormulaApplicationStep';
import { RewardFormulaWeightsStep } from './RewardFormulaWeightsStep';
import { RewardFormulaReviewStep } from './RewardFormulaReviewStep';
import type { RewardFormulaRow } from '../types/reward-formula.types';

interface Option { id: string; nome: string }
type Payload = ReturnType<ReturnType<typeof useRewardFormulaEditor>['buildPayload']>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  init: EditorInit;
  categorias: Option[];
  bases: Option[];
  findByCombo: (categoriaId: string | null, baseId: string | null, exceptId?: string) => RewardFormulaRow[];
  copyableFormulas: RewardFormulaRow[];
  onCreate: (data: Payload) => Promise<void>;
  onUpdate: (id: string, data: Payload) => Promise<void>;
  onOpenExisting: (r: RewardFormulaRow) => void;
}

const STEPS = ['Aplicação', 'Pesos', 'Revisão'] as const;

export function RewardFormulaEditor({ open, onOpenChange, init, categorias, bases, findByCombo, copyableFormulas, onCreate, onUpdate, onOpenExisting }: Props) {
  const isEdit = !!init.editing;
  const ed = useRewardFormulaEditor(init, open);
  const [saving, setSaving] = useState(false);

  const duplicados = useMemo(
    () => findByCombo(ed.categoriaId || null, ed.baseId || null, init.editing?.id),
    [findByCombo, ed.categoriaId, ed.baseId, init.editing?.id],
  );
  const usageFuncionarios = init.editing?.usage.funcionarios ?? 0;
  const categoriaNome = categorias.find(c => c.id === ed.categoriaId)?.nome ?? null;
  const baseNome = bases.find(b => b.id === ed.baseId)?.nome ?? null;

  const nomeOk = isValidFormulaName(ed.nome);
  const canSave = nomeOk && ed.validation.valid && !saving;
  const canAdvance = ed.step === 1 ? nomeOk : true;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = ed.buildPayload();
      if (isEdit && init.editing) await onUpdate(init.editing.id, payload);
      else await onCreate(payload);
      onOpenChange(false);
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar fórmula' : 'Nova fórmula de cálculo'}</DialogTitle>
          <DialogDescription>Pesos dos critérios usados no cálculo das premiações.</DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3;
            const active = ed.step === n;
            const done = ed.step > n;
            return (
              <button key={label} type="button" onClick={() => (n < ed.step || canAdvance) && ed.setStep(n)}
                className={cn('flex flex-1 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  active ? 'border-[#08783e] bg-[#08783e]/10 text-[#08783e]' : done ? 'border-border/70 text-foreground' : 'border-border/60 text-muted-foreground')}>
                <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[11px]', active ? 'bg-[#08783e] text-white' : 'bg-muted text-muted-foreground')}>{n}</span>
                {label}
              </button>
            );
          })}
        </div>

        <div className="max-h-[60vh] overflow-y-auto pr-1">
          {ed.step === 1 && (
            <RewardFormulaApplicationStep
              nome={ed.nome} setNome={ed.setNome} descricao={ed.descricao} setDescricao={ed.setDescricao}
              categoriaId={ed.categoriaId} setCategoriaId={ed.setCategoriaId} baseId={ed.baseId} setBaseId={ed.setBaseId}
              categorias={categorias} bases={bases} duplicados={duplicados} onOpenExisting={onOpenExisting}
            />
          )}
          {ed.step === 2 && (
            <RewardFormulaWeightsStep
              weights={ed.weights} validation={ed.validation} onSetWeight={ed.setWeight}
              onZerar={ed.zerarTodos} onDistribuir={ed.distribuirIgualmente} onCopiarDe={ed.copiarDe}
              copyableFormulas={copyableFormulas.filter(f => f.id !== init.editing?.id)}
            />
          )}
          {ed.step === 3 && (
            <RewardFormulaReviewStep
              nome={ed.nome} descricao={ed.descricao} categoriaNome={categoriaNome} baseNome={baseNome}
              weights={ed.weights} validation={ed.validation} duplicados={duplicados} usageFuncionarios={usageFuncionarios}
            />
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          <div>
            {ed.step > 1 && <Button variant="outline" className="gap-1.5" onClick={() => ed.setStep((ed.step - 1) as 1 | 2 | 3)} disabled={saving}><ChevronLeft className="h-4 w-4" /> Voltar</Button>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            {ed.step < 3 ? (
              <Button className="gap-1.5" onClick={() => ed.setStep((ed.step + 1) as 1 | 2 | 3)} disabled={!canAdvance}>Avançar <ChevronRight className="h-4 w-4" /></Button>
            ) : (
              <Button className="gap-1.5" onClick={handleSave} disabled={!canSave}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isEdit ? 'Salvar alterações' : 'Criar fórmula'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
