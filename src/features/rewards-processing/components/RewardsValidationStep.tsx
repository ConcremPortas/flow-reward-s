import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { RewardsValidationGroup } from './RewardsValidationGroup';
import type { ValidationResult } from '../types/rewards-processing.types';

interface Props {
  validation: ValidationResult;
  onRevalidate: () => void;
  onBack: () => void;
  onNext: () => void;
}

/** Etapa 2 — preflight. Bloqueios impedem o avanço; atenções exigem ciência. */
export function RewardsValidationStep({ validation, onRevalidate, onBack, onNext }: Props) {
  const navigate = useNavigate();
  const [ciente, setCiente] = useState(false);
  const blocked = !validation.canProceed;
  const precisaCiencia = !blocked && validation.atencoes > 0;
  const canNext = !blocked && (!precisaCiencia || ciente);

  return (
    <div className="space-y-4">
      <div className={cn('flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-5 py-4',
        blocked ? 'border-destructive/30 bg-destructive/[0.04]' : 'border-success/30 bg-success/[0.04]')}>
        <div className="flex items-center gap-3">
          <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', blocked ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>
            {blocked ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          </span>
          <div>
            <p className="text-sm font-bold text-foreground">{blocked ? 'Processamento bloqueado' : 'Pronto para processar'}</p>
            <p className="text-xs text-muted-foreground">{validation.bloqueios} bloqueio(s) · {validation.atencoes} ponto(s) de atenção</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={onRevalidate}><RefreshCw className="h-4 w-4" /> Revalidar</Button>
      </div>

      <SectionCard title="Verificações">
        <div className="space-y-5">
          {validation.groups.map(g => <RewardsValidationGroup key={g.key} group={g} onNavigate={(to) => navigate(to)} />)}
        </div>
      </SectionCard>

      {precisaCiencia && (
        <label className="flex items-center gap-2 rounded-xl border border-status-warning/30 bg-status-warning/5 p-3 text-sm text-foreground">
          <Checkbox checked={ciente} onCheckedChange={(v) => setCiente(!!v)} />
          Estou ciente dos {validation.atencoes} ponto(s) de atenção e desejo continuar.
        </label>
      )}

      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-1.5" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Parâmetros</Button>
        <Button className="gap-1.5" onClick={onNext} disabled={!canNext}>Calcular prévia <ArrowRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
