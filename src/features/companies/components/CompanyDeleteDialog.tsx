import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { pluralizeBR } from '@/lib/formatters';
import { hasActiveLinks } from '../domain/companyDependencies';
import type { CompanyRow } from '../types/company.types';

interface Props {
  row: CompanyRow | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (r: CompanyRow) => Promise<void>;
  onVerSetores: (r: CompanyRow) => void;
}

/**
 * Exclusão crítica: audita dependências (em lote). BLOQUEIA com vínculos ativos
 * (setores ou funcionários). Sem vínculos → soft-delete (desativa). O histórico é
 * mostrado como contexto. Sem window.confirm; mensagens legíveis.
 */
export function CompanyDeleteDialog({ row, onOpenChange, onConfirm, onVerSetores }: Props) {
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
          <AlertDialogTitle>Excluir empresa</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p><strong>{row.nome}</strong></p>
              {bloqueado ? (
                <>
                  <p>Esta empresa possui:</p>
                  <ul className="ml-4 list-disc space-y-0.5">
                    {u.setores > 0 && <li>{pluralizeBR(u.setores, 'setor vinculado', 'setores vinculados')}</li>}
                    {u.funcionarios > 0 && <li>{pluralizeBR(u.funcionarios, 'funcionário vinculado', 'funcionários vinculados')}</li>}
                    {u.resultadosHistoricos > 0 && <li>{pluralizeBR(u.resultadosHistoricos, 'resultado histórico', 'resultados históricos')}</li>}
                  </ul>
                  <p className="text-status-warning">Não é possível excluir esta empresa enquanto existirem vínculos ativos. Reatribua setores e funcionários antes de excluir.</p>
                </>
              ) : (
                <p>Esta empresa não possui setores nem funcionários vinculados. A exclusão a desativará (soft-delete). Registros históricos são preservados.</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{bloqueado ? 'Fechar' : 'Cancelar'}</AlertDialogCancel>
          {bloqueado ? (
            u.setores > 0
              ? <Button onClick={() => { onVerSetores(row); onOpenChange(false); }}>Ver setores</Button>
              : null
          ) : (
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handle(); }} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Excluindo...' : 'Excluir empresa'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
