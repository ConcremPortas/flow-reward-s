import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { pluralizeBR } from '@/lib/formatters';
import { hasActiveLinks } from '../domain/dssLocationDependencies';
import type { DssLocationRow } from '../types/dss-location.types';

interface Props {
  row: DssLocationRow | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (r: DssLocationRow) => Promise<void>;
  onVerFuncionarios: (r: DssLocationRow) => void;
  onVerHistorico: (r: DssLocationRow) => void;
}

/**
 * Exclusão sensível: audita vínculos (em lote). BLOQUEIA com funcionários OU DSS
 * (histórico). Sem vínculos → soft-delete. Sem window.confirm; mensagens legíveis.
 */
export function DssLocationDeleteDialog({ row, onOpenChange, onConfirm, onVerFuncionarios, onVerHistorico }: Props) {
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
          <AlertDialogTitle>Excluir local de DSS</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p><strong>{row.nome}</strong></p>
              {bloqueado ? (
                <>
                  <p>Este local possui:</p>
                  <ul className="ml-4 list-disc space-y-0.5">
                    {u.funcionarios > 0 && <li>{pluralizeBR(u.funcionarios, 'funcionário vinculado', 'funcionários vinculados')}</li>}
                    {u.dssRealizados > 0 && <li>{pluralizeBR(u.dssRealizados, 'DSS realizado', 'DSS realizados')}</li>}
                    {u.presencas > 0 && <li>{pluralizeBR(u.presencas, 'registro de presença', 'registros de presença')}</li>}
                  </ul>
                  <p className="text-status-warning">Não é possível excluir enquanto existirem vínculos. Reatribua os funcionários antes de excluir; o histórico de DSS é preservado.</p>
                </>
              ) : (
                <p>Este local não possui funcionários nem DSS. A exclusão o desativará (soft-delete).</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
          <AlertDialogCancel disabled={deleting}>{bloqueado ? 'Fechar' : 'Cancelar'}</AlertDialogCancel>
          {bloqueado ? (
            <>
              {u.funcionarios > 0 && <Button variant="outline" onClick={() => { onVerFuncionarios(row); onOpenChange(false); }}>Ver funcionários</Button>}
              {u.dssRealizados > 0 && <Button variant="outline" onClick={() => { onVerHistorico(row); onOpenChange(false); }}>Ver histórico</Button>}
            </>
          ) : (
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handle(); }} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Excluindo...' : 'Excluir local'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
