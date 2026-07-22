import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { pluralizeBR } from '@/lib/formatters';
import { hasActiveLinks } from '../domain/functionDependencies';
import type { FunctionRow } from '../types/function.types';

interface Props {
  row: FunctionRow | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (r: FunctionRow) => Promise<void>;
  onVerFuncionarios: (r: FunctionRow) => void;
}

/**
 * Exclusão sensível: audita vínculos (em lote). BLOQUEIA quando há funcionários
 * ativos vinculados (não é possível excluir com vínculos ativos). Sem vínculos
 * atuais, a exclusão é SOFT (desativa) e o histórico é mostrado como impacto.
 */
export function FunctionDeleteDialog({ row, onOpenChange, onConfirm, onVerFuncionarios }: Props) {
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
          <AlertDialogTitle>Excluir função</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p><strong>{row.nome}</strong></p>
              {bloqueado ? (
                <>
                  <p>{pluralizeBR(u.funcionarios, 'funcionário está vinculado', 'funcionários estão vinculados')} a esta função.</p>
                  <p className="text-status-warning">Não é possível excluir enquanto existirem vínculos ativos. Realoque os funcionários antes de excluir.</p>
                </>
              ) : u.resultadosHistoricos > 0 ? (
                <>
                  <p>Esta função não possui funcionários vinculados atualmente, mas há {pluralizeBR(u.resultadosHistoricos, 'resultado histórico', 'resultados históricos')} de premiação com este nome.</p>
                  <p className="text-muted-foreground">A exclusão desativa a função. Os resultados históricos são preservados (guardam o nome como registro).</p>
                </>
              ) : (
                <p>Esta função não possui vínculos. A exclusão a desativará.</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{bloqueado ? 'Fechar' : 'Cancelar'}</AlertDialogCancel>
          {bloqueado ? (
            <Button onClick={() => { onVerFuncionarios(row); onOpenChange(false); }}>Ver funcionários</Button>
          ) : (
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handle(); }} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Excluindo...' : 'Excluir função'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
