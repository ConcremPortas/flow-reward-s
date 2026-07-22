import { cn } from '@/lib/utils';

interface Props {
  conforme: boolean;
  changed?: boolean;
  onChange: (conforme: boolean) => void;
  label: string; // ex.: "Situação de EPI de João Silva"
}

/** Controle de situação explícito (segmented control) — Conforme | Não conforme. */
export function EpiComplianceControl({ conforme, changed, onChange, label }: Props) {
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
        aria-checked={conforme}
        aria-label={`${label} — conforme`}
        onClick={() => onChange(true)}
        className={cn(
          'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
          conforme ? 'bg-success text-white shadow-sm' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Conforme
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={!conforme}
        aria-label={`${label} — não conforme`}
        onClick={() => onChange(false)}
        className={cn(
          'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
          !conforme ? 'bg-destructive text-white shadow-sm' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        Não conforme
      </button>
    </div>
  );
}
