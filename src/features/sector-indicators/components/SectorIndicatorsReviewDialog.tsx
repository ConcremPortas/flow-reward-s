import { Loader2, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumberBR, pluralizeBR } from '@/lib/formatters';
import { competenciaLabelLong } from '@/features/dashboard/utils/dates';
import { getIndicatorDefinition } from '../domain/indicatorDefinitions';
import type { IndicatorDirtyDiff } from '../domain/indicatorComparison';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competencia: string;
  diff: IndicatorDirtyDiff;
  setorNome: (setorId: string) => string;
  saving: boolean;
  error: string | null;
  onConfirm: () => void;
}

const fmt = (v: number | null) => (v == null ? '—' : formatNumberBR(v, Number.isInteger(v) ? 0 : 2));

export function SectorIndicatorsReviewDialog({ open, onOpenChange, competencia, diff, setorNome, saving, error, onConfirm }: Props) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Revisar alterações</DialogTitle>
          <DialogDescription>
            {competenciaLabelLong(competencia)} · {pluralizeBR(diff.totalSetoresAlterados, 'setor alterado', 'setores alterados')}
            {' · '}{pluralizeBR(diff.indicadoresAlterados, 'indicador modificado', 'indicadores modificados')}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[50vh] overflow-auto rounded-lg border border-border/70">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead>Setor</TableHead>
                <TableHead>Indicador</TableHead>
                <TableHead>Campo</TableHead>
                <TableHead className="text-right">Anterior</TableHead>
                <TableHead className="text-right">Novo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diff.changedFields.map((c, i) => (
                <TableRow key={`${c.setorId}-${c.indicatorId}-${c.field}-${i}`}>
                  <TableCell className="text-sm font-medium">{setorNome(c.setorId)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{getIndicatorDefinition(c.indicatorId).shortLabel}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.field === 'meta' ? 'Meta' : 'Realizado'}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{fmt(c.anterior)}</TableCell>
                  <TableCell className="text-right text-sm font-semibold tabular-nums">{fmt(c.novo)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Voltar</Button>
          <Button className="gap-1.5" onClick={onConfirm} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Salvando...' : 'Confirmar salvamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
