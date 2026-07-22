import { Check, AlertTriangle, Plus, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { COVERAGE_CELL_META } from '../domain/rewardFormulaCoverage';
import type { CoverageCell } from '../types/reward-formula.types';

const ICON = { configurada: Check, incompleta: AlertTriangle, duplicada: Copy, sem_formula: Plus };
const CLS: Record<CoverageCell['state'], string> = {
  configurada: 'border-success/40 bg-success/10 text-success hover:bg-success/15',
  incompleta: 'border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/15',
  duplicada: 'border-status-warning/40 bg-status-warning/10 text-status-warning hover:bg-status-warning/15',
  sem_formula: 'border-dashed border-border/70 bg-transparent text-muted-foreground hover:bg-muted/50',
};

export function RewardFormulaCoverageCell({ cell, onClick }: { cell: CoverageCell; onClick: () => void }) {
  const meta = COVERAGE_CELL_META[cell.state];
  const Icon = ICON[cell.state];
  return (
    <button
      type="button" onClick={onClick}
      aria-label={meta.label}
      className={cn('flex w-full items-center justify-center gap-1 rounded-lg border px-2 py-2 text-[11px] font-medium transition-colors', CLS[cell.state])}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{meta.label}{cell.state === 'duplicada' && ` (${cell.formulaIds.length})`}</span>
    </button>
  );
}
