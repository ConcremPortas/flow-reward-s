import { ArrowLeft, ArrowRight } from 'lucide-react';
import { prevView, nextView, type ViewKey } from '@/features/dashboard/views';

interface Props {
  active: ViewKey;
  onChange: (v: ViewKey) => void;
}

/** Navegação anterior/próxima no rodapé. */
export function AnalyticsFooterNavigation({ active, onChange }: Props) {
  const prev = prevView(active);
  const next = nextView(active);

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-4">
      {prev ? (
        <button type="button" onClick={() => onChange(prev.key)} className="group inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3.5 py-2 text-sm text-foreground transition-colors hover:border-primary/25 hover:bg-muted/40">
          <ArrowLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5" />
          <span className="text-left"><span className="block text-[10px] uppercase tracking-wide text-muted-foreground">{prev.num} · anterior</span><span className="block font-medium leading-tight">{prev.short}</span></span>
        </button>
      ) : <span />}

      {next ? (
        <button type="button" onClick={() => onChange(next.key)} className="group inline-flex items-center gap-2 rounded-lg border border-border/70 bg-card px-3.5 py-2 text-sm text-foreground transition-colors hover:border-primary/25 hover:bg-muted/40">
          <span className="text-right"><span className="block text-[10px] uppercase tracking-wide text-muted-foreground">{next.num} · próximo</span><span className="block font-medium leading-tight">{next.short}</span></span>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </button>
      ) : <span />}
    </div>
  );
}
