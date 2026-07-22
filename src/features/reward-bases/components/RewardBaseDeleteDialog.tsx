import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { pluralizeBR } from '@/lib/formatters';
import { hasActiveLinks } from '../domain/rewardBaseDependencies';
import type { RewardBaseRow } from '../types/reward-base.types';

interface Props {
  row: RewardBaseRow | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (r: RewardBaseRow) => Promise<void>;
  onVinculos: (r: RewardBaseRow) => void;
}

/**
 * Exclusão sensível: audita vínculos (em lote). BLOQUEIA com vínculos ativos
 * (funcionários ou fórmulas). Sem vínculos ativos → soft-delete; o histórico é
 * mostrado como impacto (não bloqueia). Sem window.confirm.
 */
export function RewardBaseDeleteDialog({ row, onOpenChange, onConfirm, onVinculos }: Props) {
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
          <AlertDialogTitle>Excluir base de premiação</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p><strong>{row.nome}</strong></p>
              {bloqueado ? (
                <>
                  <p>Esta base possui:</p>
                  <ul className="ml-4 list-disc space-y-0.5">
                    {u.funcionarios > 0 && <li>{pluralizeBR(u.funcionarios, 'funcionário vinculado', 'funcionários vinculados')}</li>}
                    {u.formulas > 0 && <li>{pluralizeBR(u.formulas, 'fórmula de cálculo relacionada', 'fórmulas de cálculo relacionadas')}</li>}
                    {u.resultadosHistoricos > 0 && <li>{pluralizeBR(u.resultadosHistoricos, 'resultado histórico', 'resultados históricos')}</li>}
                  </ul>
                  <p className="text-status-warning">Não é possível excluir esta base enquanto existirem vínculos ativos. Reatribua funcionários e fórmulas antes de excluir.</p>
                </>
              ) : u.resultadosHistoricos > 0 ? (
                <>
                  <p>Sem vínculos ativos, mas há {pluralizeBR(u.resultadosHistoricos, 'resultado histórico', 'resultados históricos')} de premiação com esta base.</p>
                  <p className="text-muted-foreground">A exclusão desativa a base. Os resultados históricos são preservados (guardam os valores calculados).</p>
                </>
              ) : (
                <p>Esta base não possui vínculos. A exclusão a desativará.</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{bloqueado ? 'Fechar' : 'Cancelar'}</AlertDialogCancel>
          {bloqueado ? (
            <Button onClick={() => { onVinculos(row); onOpenChange(false); }}>Ver vínculos</Button>
          ) : (
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handle(); }} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Excluindo...' : 'Excluir base'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
