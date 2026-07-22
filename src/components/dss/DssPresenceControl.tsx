import { cn } from '@/lib/utils';

interface Props {
  presente: boolean;
  changed?: boolean;
  onChange: (presente: boolean) => void;
  label: string; // ex.: "Presença de João Silva"
}

/** Controle de presença explícito (segmented control) — Presente | Ausente. */
export function DssPresenceControl({ presente, changed, onChange, label }: Props) {
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); onChange(true); }
    if (e.key === 'ArrowRight') { e.preventDefault(); onChange(false); }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        'inline-flex rounded-lg border p-0.5',
        changed ? 'border-status-warning/50 bg-status-warning/[0.06]' : 'border-border bg-muted/40',
      )}
    >
      <button
        type="button"
        role="radio"
        aria-checked={presente}
        aria-label={`${label} — presente`}
        onClick={() => onChange(true)}
        className={cn(
          'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
          presente ? 'bg-success text-white shadow-sm' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Presente
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={!presente}
        aria-label={`${label} — ausente`}
        onClick={() => onChange(false)}
        className={cn(
          'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
          !presente ? 'bg-destructive text-white shadow-sm' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Ausente
      </button>
    </div>
  );
}
