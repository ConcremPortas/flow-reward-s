import { Check, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { DSS_WIZARD_STEPS } from '@/features/dss/types';
import { DssInformationStep } from './DssInformationStep';
import { DssAttendanceStep } from './DssAttendanceStep';
import { DssReviewStep } from './DssReviewStep';
import type { UseDssRegistrationReturn } from '@/features/dss/hooks/useDssRegistration';
import type { LocalDSS } from '@/hooks/useLocaisDSS';
import type { LocationSummary } from '@/features/dss/types';

interface Option { id: string; nome: string }

interface Props {
  registration: UseDssRegistrationReturn;
  locais: LocalDSS[];
  setores: Option[];
  locationSummary: LocationSummary | null;
  onCancel: () => void;
}

/** Fluxo de 3 etapas dentro da página (não é modal). */
export function DssRegistrationStepper({ registration: r, locais, setores, locationSummary, onCancel }: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        {DSS_WIZARD_STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() => { if (i <= r.step || r.stepValid) r.setStep(i as 0 | 1 | 2); }}
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                i < r.step ? 'bg-primary text-primary-foreground' : i === r.step ? 'bg-primary/15 text-primary ring-2 ring-primary/30' : 'bg-muted text-muted-foreground',
              )}
            >
              {i < r.step ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </button>
            <span className={cn('text-xs font-medium', i === r.step ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
            {i < DSS_WIZARD_STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      {r.step === 0 && (
        <DssInformationStep data={r.data} errors={r.stepErrors} onChange={r.patch} locais={locais} locationSummary={locationSummary} />
      )}
      {r.step === 1 && <DssAttendanceStep attendance={r.attendance} setores={setores} />}
      {r.step === 2 && <DssReviewStep data={r.data} locais={locais} presentes={r.attendance.presentes} ausentes={r.attendance.ausentes} />}

      {r.saveError && <p className="text-sm text-destructive">{r.saveError}</p>}

      <div className="flex items-center justify-between border-t border-border/60 pt-4">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <div className="flex items-center gap-2">
          {r.step > 0 && <Button variant="outline" className="gap-1.5" onClick={r.goBack}><ChevronLeft className="h-4 w-4" /> Voltar</Button>}
          {r.step < 2 ? (
            <Button className="gap-1.5" onClick={r.goNext}>Continuar <ChevronRight className="h-4 w-4" /></Button>
          ) : (
            <Button className="gap-1.5" onClick={r.submit} disabled={r.saving}>
              <Save className="h-4 w-4" /> {r.saving ? 'Salvando...' : 'Salvar DSS'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
