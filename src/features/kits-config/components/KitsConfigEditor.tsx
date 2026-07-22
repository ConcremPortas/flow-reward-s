import { useMemo, useState } from 'react';
import { Loader2, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useKitsConfigEditor, type KitsEditorInit } from '../hooks/useKitsConfigEditor';
import { KitsConfigParametersStep } from './KitsConfigParametersStep';
import { KitsConfigReviewStep } from './KitsConfigReviewStep';
import type { KitsConfigRow } from '../types/kits-config.types';

type Payload = ReturnType<ReturnType<typeof useKitsConfigEditor>['buildPayload']>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  init: KitsEditorInit;
  atual: KitsConfigRow | null;
  competenciaAtual: string;
  findByVigencia: (vigencia: string, exceptId?: string) => KitsConfigRow | undefined;
  retroFor: (vigencia: string) => { competencias: string[]; resultados: number };
  onCreate: (data: Payload) => Promise<void>;
  onUpdate: (id: string, data: Payload) => Promise<void>;
  onOpenExisting: (r: KitsConfigRow) => void;
}

const STEPS = ['Parâmetros', 'Revisão e impacto'] as const;

export function KitsConfigEditor({ open, onOpenChange, init, atual, competenciaAtual, findByVigencia, retroFor, onCreate, onUpdate, onOpenExisting }: Props) {
  const isEdit = !!init.editing;
  const ed = useKitsConfigEditor(init, open);
  const [saving, setSaving] = useState(false);
  const [confirmRetro, setConfirmRetro] = useState(false);

  const duplicado = useMemo(
    () => (ed.parsed.vigenciaInicio ? findByVigencia(ed.parsed.vigenciaInicio, init.editing?.id) : undefined),
    [ed.parsed.vigenciaInicio, findByVigencia, init.editing?.id],
  );
  const retro = useMemo(
    () => (ed.parsed.vigenciaInicio ? retroFor(ed.parsed.vigenciaInicio) : { competencias: [], resultados: 0 }),
    [ed.parsed.vigenciaInicio, retroFor],
  );
  const isRetro = retro.competencias.length > 0;

  const canAdvance = ed.step === 1 ? (ed.validation.valid && !duplicado) : true;
  const canSave = ed.validation.valid && !duplicado && (!isRetro || confirmRetro) && !saving;

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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar configuração' : init.presetFrom ? 'Nova vigência (a partir de existente)' : 'Nova configuração de kits'}</DialogTitle>
          <DialogDescription>Parâmetros do cálculo de bônus por produção de kits.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => {
            const n = (i + 1) as 1 | 2;
            const active = ed.step === n;
            return (
              <button key={label} type="button" onClick={() => (n < ed.step || canAdvance) && ed.setStep(n)}
                className={cn('flex flex-1 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                  active ? 'border-[#08783e] bg-[#08783e]/10 text-[#08783e]' : 'border-border/60 text-muted-foreground')}>
                <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[11px]', active ? 'bg-[#08783e] text-white' : 'bg-muted text-muted-foreground')}>{n}</span>
                {label}
              </button>
            );
          })}
        </div>

        <div className="max-h-[58vh] overflow-y-auto pr-1">
          {ed.step === 1
            ? <KitsConfigParametersStep ed={ed} duplicado={duplicado} onOpenExisting={onOpenExisting} />
            : <KitsConfigReviewStep ed={ed} atual={atual} competenciaAtual={competenciaAtual} retro={retro} />}
        </div>

        {ed.step === 2 && isRetro && (
          <label className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <Checkbox checked={confirmRetro} onCheckedChange={(v) => setConfirmRetro(!!v)} className="mt-0.5" />
            <span className="text-foreground">Confirmo que a vigência é retroativa e afeta competências já processadas nos próximos processamentos. Resultados já salvos não serão recalculados.</span>
          </label>
        )}

        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          <div>{ed.step > 1 && <Button variant="outline" className="gap-1.5" onClick={() => ed.setStep(1)} disabled={saving}><ChevronLeft className="h-4 w-4" /> Voltar</Button>}</div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
            {ed.step < 2 ? (
              <Button className="gap-1.5" onClick={() => ed.setStep(2)} disabled={!canAdvance}>Avançar <ChevronRight className="h-4 w-4" /></Button>
            ) : (
              <Button className="gap-1.5" onClick={handleSave} disabled={!canSave}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isEdit ? 'Salvar alterações' : 'Criar configuração'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
