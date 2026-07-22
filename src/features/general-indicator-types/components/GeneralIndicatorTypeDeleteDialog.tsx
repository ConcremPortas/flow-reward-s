import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { pluralizeBR } from '@/lib/formatters';
import { hasActiveLinks } from '../domain/generalIndicatorTypeDependencies';
import type { GeneralIndicatorTypeRow } from '../types/general-indicator-type.types';

interface Props {
  row: GeneralIndicatorTypeRow | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (r: GeneralIndicatorTypeRow) => Promise<void>;
  onVerMedicoes: (r: GeneralIndicatorTypeRow) => void;
}

/**
 * Exclusão sensível: HARD DELETE. BLOQUEIA quando há medições (evita erro de FK e
 * preserva histórico). Sugere Inativar como alternativa. Sem window.confirm.
 */
export function GeneralIndicatorTypeDeleteDialog({ row, onOpenChange, onConfirm, onVerMedicoes }: Props) {
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
          <AlertDialogTitle>Excluir indicador geral</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p><span className="font-mono font-semibold">{row.codigo}</span> · {row.nome}</p>
              {bloqueado ? (
                <>
                  <p>Este indicador possui {pluralizeBR(u.medicoes, 'medição registrada', 'medições registradas')} em {pluralizeBR(u.competencias, 'competência', 'competências')}.</p>
                  <p className="text-status-warning">Não é possível excluir este indicador enquanto existirem medições registradas. Para retirá-lo de novos lançamentos sem perder o histórico, use <strong>Inativar</strong>.</p>
                </>
              ) : (
                <p>Este indicador não possui medições. A exclusão é permanente (remoção do cadastro).</p>
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
