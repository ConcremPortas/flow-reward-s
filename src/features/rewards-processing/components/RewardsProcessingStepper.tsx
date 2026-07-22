import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepKey = 'parametros' | 'validacao' | 'previa' | 'confirmacao';

export const STEPS: { key: StepKey; label: string }[] = [
  { key: 'parametros', label: 'Parâmetros' },
  { key: 'validacao', label: 'Validação' },
  { key: 'previa', label: 'Prévia' },
  { key: 'confirmacao', label: 'Confirmação' },
];

interface Props {
  current: StepKey;
  /** Permite voltar a etapas já visitadas. */
  onGoTo?: (step: StepKey) => void;
  reached: Set<StepKey>;
}

/** Stepper horizontal (vira compacto/rolável em telas menores). */
export function RewardsProcessingStepper({ current, onGoTo, reached }: Props) {
  const currentIdx = STEPS.findIndex(s => s.key === current);
  return (
    <ol className="flex items-center gap-1 overflow-x-auto rounded-xl border border-border/70 bg-card px-3 py-2.5">
      {STEPS.map((s, i) => {
        const isCurrent = s.key === current;
        const isDone = i < currentIdx;
        const canGo = reached.has(s.key) && !!onGoTo;
        return (
          <li key={s.key} className="flex shrink-0 items-center">
            <button
              type="button"
              disabled={!canGo}
              onClick={() => canGo && onGoTo!(s.key)}
              className={cn('flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                isCurrent ? 'text-foreground' : isDone ? 'text-success' : 'text-muted-foreground',
                canGo && 'hover:bg-muted')}
            >
              <span className={cn('flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold',
                isCurrent ? 'bg-primary text-primary-foreground' : isDone ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground')}>
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </span>
              <span className="whitespace-nowrap">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && <span className={cn('mx-1 h-px w-6 sm:w-10', isDone ? 'bg-success/40' : 'bg-border')} />}
          </li>
        );
      })}
    </ol>
  );
}
