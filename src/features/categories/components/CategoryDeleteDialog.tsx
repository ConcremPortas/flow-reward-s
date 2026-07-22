import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { pluralizeBR } from '@/lib/formatters';
import { hasActiveLinks } from '../domain/categoryDependencies';
import type { CategoryRow } from '../types/category.types';

interface Props {
  row: CategoryRow | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (r: CategoryRow) => Promise<void>;
  onVerFuncionarios: (r: CategoryRow) => void;
}

/**
 * Exclusão sensível: audita vínculos (em lote). BLOQUEIA quando há vínculos
 * ativos (funcionários, faixas ou fórmulas). Sem vínculos ativos → soft-delete;
 * o histórico é mostrado como impacto (não bloqueia). Sem window.confirm.
 */
export function CategoryDeleteDialog({ row, onOpenChange, onConfirm, onVerFuncionarios }: Props) {
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
          <AlertDialogTitle>Excluir categoria</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p><strong>{row.nome}</strong></p>
              {bloqueado ? (
                <>
                  <p>Esta categoria possui:</p>
                  <ul className="ml-4 list-disc space-y-0.5">
                    {u.funcionarios > 0 && <li>{pluralizeBR(u.funcionarios, 'funcionário vinculado', 'funcionários vinculados')}</li>}
                    {u.faixas > 0 && <li>{pluralizeBR(u.faixas, 'faixa relacionada', 'faixas relacionadas')}</li>}
                    {u.formulas > 0 && <li>{pluralizeBR(u.formulas, 'fórmula de cálculo relacionada', 'fórmulas de cálculo relacionadas')}</li>}
                    {u.resultadosHistoricos > 0 && <li>{pluralizeBR(u.resultadosHistoricos, 'resultado histórico', 'resultados históricos')}</li>}
                  </ul>
                  <p className="text-status-warning">Não é possível excluir enquanto existirem vínculos ativos. Realoque os funcionários e ajuste faixas/fórmulas antes de excluir.</p>
                </>
              ) : u.resultadosHistoricos > 0 ? (
                <>
                  <p>Sem vínculos ativos, mas há {pluralizeBR(u.resultadosHistoricos, 'resultado histórico', 'resultados históricos')} de premiação com este nome.</p>
                  <p className="text-muted-foreground">A exclusão desativa a categoria. Os resultados históricos são preservados (guardam o nome como registro).</p>
                </>
              ) : (
                <p>Esta categoria não possui vínculos. A exclusão a desativará.</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{bloqueado ? 'Fechar' : 'Cancelar'}</AlertDialogCancel>
          {bloqueado ? (
            u.funcionarios > 0
              ? <Button onClick={() => { onVerFuncionarios(row); onOpenChange(false); }}>Ver funcionários</Button>
              : null
          ) : (
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handle(); }} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Excluindo...' : 'Excluir categoria'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
