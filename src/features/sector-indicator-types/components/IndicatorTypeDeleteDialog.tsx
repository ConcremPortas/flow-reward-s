import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { pluralizeBR } from '@/lib/formatters';
import { hasActiveLinks } from '../domain/indicatorTypeDependencies';
import type { IndicatorTypeRow } from '../types/indicator-type.types';

interface Props {
  row: IndicatorTypeRow | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (r: IndicatorTypeRow) => Promise<void>;
  onVerMedicoes: (r: IndicatorTypeRow) => void;
}

/**
 * Exclusão sensível: audita medições (em lote, por correspondência código↔coluna).
 * BLOQUEIA quando há medições registradas. Sem medições → soft-delete (ativo=false).
 * Sem window.confirm; bloqueio de duplo envio.
 */
export function IndicatorTypeDeleteDialog({ row, onOpenChange, onConfirm, onVerMedicoes }: Props) {
  const [deleting, setDeleting] = useState(false);
  if (!row) return null;
  const u = row.usage;
  const bloqueado = hasActiveLinks(u);

  const handle = async () => {
    if (deleting || bloqueado) return;
    setDeleting(true);
    try { await onConfirm(row); onOpenChange(false); } finally { setDeleting(false); }
  };

  return (
    <AlertDialog open={!!row} onOpenChange={(o) => { if (!deleting) onOpenChange(o); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir tipo de indicador</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p><span className="font-mono font-semibold">{row.codigo}</span> · {row.nome}</p>
              {bloqueado ? (
                <>
                  <p>Este indicador possui:</p>
                  <ul className="ml-4 list-disc space-y-0.5">
                    <li>{pluralizeBR(u.medicoes, 'medição registrada', 'medições registradas')}</li>
                    {u.setores > 0 && <li>{pluralizeBR(u.setores, 'setor com medição', 'setores com medições')}</li>}
                    {u.competencias > 0 && <li>{pluralizeBR(u.competencias, 'competência registrada', 'competências registradas')}</li>}
                  </ul>
                  <p className="text-status-warning">Não é possível excluir este indicador enquanto existirem medições registradas. As medições não são alteradas.</p>
                </>
              ) : (
                <p>Este indicador não possui medições registradas. A exclusão o desativará (soft-delete). O histórico é preservado.</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{bloqueado ? 'Fechar' : 'Cancelar'}</AlertDialogCancel>
          {bloqueado ? (
            <Button onClick={() => { onVerMedicoes(row); onOpenChange(false); }}>Ver medições</Button>
          ) : (
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handle(); }} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Excluindo...' : 'Excluir indicador'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
