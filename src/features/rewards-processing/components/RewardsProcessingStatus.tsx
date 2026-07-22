import { Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ProcessingPhase = 'calculando' | 'salvando' | 'validando' | 'concluido';

const PHASES: { key: ProcessingPhase; label: string }[] = [
  { key: 'calculando', label: 'Calculando' },
  { key: 'salvando', label: 'Salvando' },
  { key: 'validando', label: 'Validando resultado' },
  { key: 'concluido', label: 'Concluído' },
];

/** Estados reais do processamento síncrono (sem barra de progresso falsa). */
export function RewardsProcessingStatus({ phase }: { phase: ProcessingPhase }) {
  const idx = PHASES.findIndex(p => p.key === phase);
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <ol className="flex flex-wrap items-center justify-center gap-3">
        {PHASES.map((p, i) => {
          const done = i < idx;
          const current = i === idx;
          return (
            <li key={p.key} className={cn('flex items-center gap-2 text-sm', done ? 'text-success' : current ? 'text-foreground' : 'text-muted-foreground')}>
              <span className={cn('flex h-6 w-6 items-center justify-center rounded-full', done ? 'bg-success/15 text-success' : current ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                {done ? <Check className="h-3.5 w-3.5" /> : current ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : i + 1}
              </span>
              {p.label}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
