import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatCurrencyBRL, pluralizeBR } from '@/lib/formatters';
import type { BonusTierRow } from '../types/bonus-tier.types';

interface Props {
  row: BonusTierRow | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (r: BonusTierRow) => Promise<void>;
}

/**
 * Exclusão sensível: audita vínculos (em lote) e mostra o impacto. Exclusão é
 * SOFT (desativa); a FK `funcionarios.faixa_id` é ON DELETE SET NULL — não há
 * bloqueio real, mas os vínculos ativos são exibidos para decisão consciente.
 */
export function BonusTierDeleteDialog({ row, onOpenChange, onConfirm }: Props) {
  const [deleting, setDeleting] = useState(false);
  if (!row) return null;
  const u = row.usage;
  const temVinculos = u.funcionarios > 0 || u.categorias > 0 || u.bases > 0 || u.resultadosHistoricos > 0;

  const handle = async () => {
    if (deleting) return;
    setDeleting(true);
    try { await onConfirm(row); onOpenChange(false); } finally { setDeleting(false); }
  };

  return (
    <AlertDialog open={!!row} onOpenChange={(o) => { if (!deleting) onOpenChange(o); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir faixa</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p><strong>{row.nome}</strong> · {formatCurrencyBRL(row.valor)}</p>
              {temVinculos ? (
                <>
                  <p>Esta faixa possui:</p>
                  <ul className="ml-4 list-disc space-y-0.5">
                    {u.funcionarios > 0 && <li>{pluralizeBR(u.funcionarios, 'funcionário vinculado', 'funcionários vinculados')}</li>}
                    {u.categorias > 0 && <li>{pluralizeBR(u.categorias, 'categoria relacionada', 'categorias relacionadas')}</li>}
                    {u.bases > 0 && <li>{pluralizeBR(u.bases, 'base relacionada', 'bases relacionadas')}</li>}
                    {u.resultadosHistoricos > 0 && <li>{pluralizeBR(u.resultadosHistoricos, 'resultado histórico', 'resultados históricos')}</li>}
                  </ul>
                  <p className="text-status-warning">A exclusão desativa a faixa. Funcionários vinculados ficarão sem faixa (valor-base zero em processamentos futuros). Resultados já salvos preservam o valor usado.</p>
                </>
              ) : (
                <p>Esta faixa não possui vínculos. A exclusão a desativará.</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handle} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {deleting ? 'Excluindo...' : 'Excluir faixa'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
