import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatCurrencyBRL, pluralizeBR } from '@/lib/formatters';
import { competenciaLabelLong } from '@/features/dashboard/utils/dates';
import type { ExportKind } from '../hooks/useRewardsExport';
import type { FinancialTotals } from '../types/rewards-report.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scope: { competencia: string; baseNome: string | null; categoria: string };
  totals: FinancialTotals;
  running: ExportKind | null;
  onRun: (kind: ExportKind) => void;
}

/**
 * Exportação organizada por finalidade. Preserva as 4 exportações existentes:
 * Detalhado (Excel/PDF, completo por funcionário) e RH (Excel/PDF, operacional).
 * Usa sempre o dataset FILTRADO (não a página visível).
 */
export function RewardsExportDialog({ open, onOpenChange, scope, totals, running, onRun }: Props) {
  const Btn = ({ kind, icon: Icon, label }: { kind: ExportKind; icon: typeof FileText; label: string }) => (
    <Button variant="outline" size="sm" className="gap-1.5" disabled={!!running} onClick={() => onRun(kind)}>
      {running === kind ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />} {label}
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Exportar relatório</DialogTitle>
          <DialogDescription>As exportações usam o escopo filtrado atual.</DialogDescription>
        </DialogHeader>

        <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Escopo da exportação</p>
          <p className="text-foreground">{scope.competencia ? competenciaLabelLong(scope.competencia) : 'Todas as competências'}</p>
          <p className="text-muted-foreground">{scope.baseNome ?? 'Todas as bases'} · {scope.categoria === 'todos' ? 'Todas as categorias' : scope.categoria}</p>
          <p className="mt-1 text-muted-foreground">{pluralizeBR(totals.resultados, 'resultado', 'resultados')} · {formatCurrencyBRL(totals.final)} em valor final</p>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-border/70 p-3">
            <p className="text-sm font-semibold text-foreground">Relatório detalhado</p>
            <p className="mb-2 text-xs text-muted-foreground">Resultados completos por funcionário, com todos os critérios.</p>
            <div className="flex flex-wrap gap-2">
              <Btn kind="detalhado-excel" icon={FileSpreadsheet} label="Excel" />
              <Btn kind="detalhado-pdf" icon={FileText} label="PDF" />
            </div>
          </div>
          <div className="rounded-xl border border-border/70 p-3">
            <p className="text-sm font-semibold text-foreground">Relatório para RH</p>
            <p className="mb-2 text-xs text-muted-foreground">Formato operacional: código, funcionário, setor, função, faixa e valores.</p>
            <div className="flex flex-wrap gap-2">
              <Btn kind="rh-excel" icon={FileSpreadsheet} label="Excel" />
              <Btn kind="rh-pdf" icon={FileText} label="PDF" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
