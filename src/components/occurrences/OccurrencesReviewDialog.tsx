import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { DirtyDiff } from '@/features/occurrences/domain/occurrenceComparison';
import { NOTA_ZERO_THRESHOLD } from '@/features/occurrences/domain/occurrenceValidation';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diff: DirtyDiff;
  funcionarios: Funcionario[];
  onConfirmSave: () => void;
  saving: boolean;
}

/** Revisão das alterações antes de salvar: valores anteriores, novos e alertas. */
export function OccurrencesReviewDialog({ open, onOpenChange, diff, funcionarios, onConfirmSave, saving }: Props) {
  const nomeOf = (id: string) => funcionarios.find((f) => f.id === id)?.nome || id;
  const alertas = diff.entries.filter((e) => e.after.faltas >= NOTA_ZERO_THRESHOLD || e.after.advertencias >= NOTA_ZERO_THRESHOLD);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Revisar alterações antes de salvar</DialogTitle></DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="Funcionários alterados" value={diff.totalFuncionariosAlterados} />
            <Stat label="Faltas (delta)" value={diff.totalFaltasDelta} />
            <Stat label="Advertências (delta)" value={diff.totalAdvertenciasDelta} />
          </div>

          {alertas.length > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-status-warning/30 bg-status-warning/[0.06] p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
              <p className="text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{alertas.length} funcionário(s)</span> atingirão {NOTA_ZERO_THRESHOLD}+ ocorrências — a nota de premiação correspondente já satura em zero a partir desse ponto.
              </p>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto rounded-lg border border-border/70">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Funcionário</TableHead>
                  <TableHead className="text-center">Faltas (antes → depois)</TableHead>
                  <TableHead className="text-center">Advertências (antes → depois)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {diff.entries.map((e) => (
                  <TableRow key={e.funcionarioId}>
                    <TableCell className="text-sm font-medium">{nomeOf(e.funcionarioId)}</TableCell>
                    <TableCell className="text-center text-sm">
                      {e.before.faltas !== e.after.faltas
                        ? <span>{e.before.faltas} → <b className="text-foreground">{e.after.faltas}</b></span>
                        : <span className="text-muted-foreground">{e.after.faltas}</span>}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {e.before.advertencias !== e.after.advertencias
                        ? <span>{e.before.advertencias} → <b className="text-foreground">{e.after.advertencias}</b></span>
                        : <span className="text-muted-foreground">{e.after.advertencias}</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border/60 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Voltar a editar</Button>
          <Button onClick={onConfirmSave} disabled={saving}>{saving ? 'Salvando...' : 'Confirmar e salvar'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/70 p-3">
      <p className="text-xl font-bold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
