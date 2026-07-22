import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { pluralizeBR } from '@/lib/formatters';
import { hasActiveLinks } from '../domain/rewardFormulaDependencies';
import type { RewardFormulaRow } from '../types/reward-formula.types';

interface Props {
  row: RewardFormulaRow | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (r: RewardFormulaRow) => Promise<void>;
  onVerUtilizacao: (r: RewardFormulaRow) => void;
}

/**
 * Exclusão crítica: audita utilização (funcionários da combinação categoria×base).
 * BLOQUEIA quando em uso (evita mudar o cálculo futuro desses funcionários, que
 * passariam a usar os pesos-padrão do motor). Exclusão é SOFT. Sem window.confirm.
 */
export function RewardFormulaDeleteDialog({ row, onOpenChange, onConfirm, onVerUtilizacao }: Props) {
  const [deleting, setDeleting] = useState(false);
  if (!row) return null;
  const bloqueado = hasActiveLinks(row.usage);

  const handle = async () => {
    if (deleting || bloqueado) return;
    setDeleting(true);
    try { await onConfirm(row); onOpenChange(false); } finally { setDeleting(false); }
  };

  return (
    <AlertDialog open={!!row} onOpenChange={(o) => { if (!deleting) onOpenChange(o); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir fórmula de cálculo</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p><strong>{row.nome}</strong> · {row.categoriaNome ?? '—'} · {row.baseNome ?? '—'}</p>
              {bloqueado ? (
                <>
                  <p>{pluralizeBR(row.usage.funcionarios, 'funcionário é atendido', 'funcionários são atendidos')} por esta combinação de categoria e base.</p>
                  <p className="text-status-warning">Não é possível excluir enquanto houver funcionários na combinação. Sem esta fórmula, o cálculo passaria a usar os pesos-padrão do motor nos próximos processamentos.</p>
                </>
              ) : (
                <p>Nenhum funcionário na combinação desta fórmula. A exclusão a desativará (soft-delete). Resultados já processados não são recalculados (não há snapshot da fórmula).</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{bloqueado ? 'Fechar' : 'Cancelar'}</AlertDialogCancel>
          {bloqueado ? (
            <Button onClick={() => { onVerUtilizacao(row); onOpenChange(false); }}>Ver utilização</Button>
          ) : (
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handle(); }} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Excluindo...' : 'Excluir fórmula'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
