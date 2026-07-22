import { Check, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { EPI_WIZARD_STEPS } from '@/features/epi/types/epi.types';
import { EpiAuditConfiguration } from './EpiAuditConfiguration';
import { EpiInspectionStep } from './EpiInspectionStep';
import { EpiAuditReview } from './EpiAuditReview';
import type { UseEpiAuditReturn } from '@/features/epi/hooks/useEpiAudit';
import type { EpiAuditGroupEnriched } from '@/features/epi/domain/epiCalculations';

interface Option { id: string; nome: string }

interface Props {
  audit: UseEpiAuditReturn;
  empresas: Option[];
  setores: Option[];
  setoresCount: number;
  ultimaAuditoria: EpiAuditGroupEnriched | null;
  onCancel: () => void;
}

/** Fluxo de 3 etapas dentro da página (não é modal). */
export function EpiAuditStepper({ audit: a, empresas, setores, setoresCount, ultimaAuditoria, onCancel }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {EPI_WIZARD_STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => { if (i <= a.step || a.stepValid) a.setStep(i as 0 | 1 | 2); }}
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                i < a.step ? 'bg-primary text-primary-foreground' : i === a.step ? 'bg-primary/15 text-primary ring-2 ring-primary/30' : 'bg-muted text-muted-foreground',
              )}
            >
              {i < a.step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </button>
            <span className={cn('text-xs font-medium', i === a.step ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
            {i < EPI_WIZARD_STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      {a.step === 0 && (
        <EpiAuditConfiguration
          data={a.data}
          errors={a.stepErrors}
          onChange={a.patch}
          ativosCount={a.auditaveis.length}
          setoresCount={setoresCount}
          ultimaAuditoria={ultimaAuditoria}
        />
      )}
      {a.step === 1 && (
        <EpiInspectionStep inspection={a.inspection} empresas={empresas} setores={setores} onReview={() => a.setStep(2)} />
      )}
      {a.step === 2 && (
        <EpiAuditReview data={a.data} auditados={a.inspection.funcionarios} conformes={a.inspection.conformes} naoConformes={a.inspection.naoConformes} />
      )}

      {a.saveError && <p className="text-sm text-destructive">{a.saveError}</p>}

      <div className="flex items-center justify-between border-t border-border/60 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <div className="flex items-center gap-2">
          {a.step > 0 && <Button variant="outline" className="gap-1.5" onClick={a.goBack}><ChevronLeft className="h-4 w-4" /> Voltar</Button>}
          {a.step < 2 ? (
            <Button className="gap-1.5" onClick={a.goNext}>Continuar <ChevronRight className="h-4 w-4" /></Button>
          ) : (
            <Button className="gap-1.5" onClick={a.submit} disabled={a.saving}>
              <Save className="h-4 w-4" /> {a.saving ? 'Salvando...' : 'Salvar Auditoria'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
