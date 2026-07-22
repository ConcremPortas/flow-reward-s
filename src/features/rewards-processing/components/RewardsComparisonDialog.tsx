import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatCurrencyBRL, pluralizeBR } from '@/lib/formatters';
import type { ComparisonResult } from '../types/rewards-processing.types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comparison: ComparisonResult | null;
}

const fmt = (v: number | null) => (v == null ? '—' : formatCurrencyBRL(v));

/** Comparação funcionário-a-funcionário (anterior x novo). Não infere causalidade. */
export function RewardsComparisonDialog({ open, onOpenChange, comparison }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Comparação de resultados{comparison ? ` — ${comparison.baseNome}` : ''}</DialogTitle>
          <DialogDescription>
            {comparison
              ? `${pluralizeBR(comparison.funcionariosAlterados, 'funcionário alterado', 'funcionários alterados')} · anterior ${formatCurrencyBRL(comparison.valorAnterior)} → novo ${formatCurrencyBRL(comparison.valorNovo)}`
              : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[55vh] overflow-auto rounded-lg border border-border/70">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Funcionário</TableHead>
                <TableHead className="text-right">Valor anterior</TableHead>
                <TableHead className="text-right">Novo valor</TableHead>
                <TableHead className="text-right">Diferença</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparison?.rows.map(r => (
                <TableRow key={r.funcionarioId}>
                  <TableCell className="text-sm font-medium">{r.nome}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{fmt(r.valorAnterior)}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{fmt(r.valorNovo)}</TableCell>
                  <TableCell className={cn('text-right text-sm font-semibold tabular-nums', (r.diferenca ?? 0) > 0 ? 'text-success' : (r.diferenca ?? 0) < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                    {r.diferenca == null ? '—' : `${r.diferenca >= 0 ? '+' : '−'}${formatCurrencyBRL(Math.abs(r.diferenca))}`}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
