import { Calculator, FileBarChart2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  onOpenReport: () => void;
  children?: ReactNode; // navegação
}

/** Cabeçalho compacto da Central de Processamento de Premiações (sem hero). */
export function RewardsProcessingHeader({ onOpenReport, children }: Props) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card px-5 py-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/10">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight tracking-tight text-foreground">Processamento de Premiações</h1>
              <p className="text-xs text-muted-foreground">Valide, simule, revise e confirme os cálculos de premiação por competência e base.</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={onOpenReport}>
            <FileBarChart2 className="h-4 w-4" /> Relatório de Premiações
          </Button>
        </div>
        {children && <div className="border-t border-border/60 pt-3">{children}</div>}
      </div>
    </div>
  );
}
