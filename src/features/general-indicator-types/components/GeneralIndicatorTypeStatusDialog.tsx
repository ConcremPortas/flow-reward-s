import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { pluralizeBR } from '@/lib/formatters';
import type { GeneralIndicatorTypeRow } from '../types/general-indicator-type.types';

interface Props {
  row: GeneralIndicatorTypeRow | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (r: GeneralIndicatorTypeRow, ativo: boolean) => Promise<void>;
}

/**
 * Ativação/Inativação — suportada pelo modelo real (coluna `ativo`, fetch mostra
 * inativos). Inativar mostra impacto e explica o comportamento; NÃO exclui
 * medições nem altera histórico.
 */
export function GeneralIndicatorTypeStatusDialog({ row, onOpenChange, onConfirm }: Props) {
  const [busy, setBusy] = useState(false);
  if (!row) return null;
  const inativar = row.ativo; // ação = alternar

  const handle = async () => {
    if (busy) return;
    setBusy(true);
    try { await onConfirm(row, !row.ativo); onOpenChange(false); } finally { setBusy(false); }
  };

  return (
    <AlertDialog open={!!row} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{inativar ? 'Inativar indicador' : 'Ativar indicador'}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p><span className="font-mono font-semibold">{row.codigo}</span> · {row.nome}</p>
              {inativar ? (
                <>
                  {row.usage.medicoes > 0 && (
                    <p>Este indicador possui {pluralizeBR(row.usage.competencias, 'competência', 'competências')} e {pluralizeBR(row.usage.medicoes, 'medição histórica', 'medições históricas')}.</p>
                  )}
                  <p className="text-muted-foreground">Ao inativar: deixa de aparecer em novos lançamentos, mas permanece no histórico e nos relatórios anteriores. Nenhuma medição é alterada ou excluída.</p>
                </>
              ) : (
                <p className="text-muted-foreground">Ao ativar, o indicador volta a ficar disponível para novos lançamentos.</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={(e) => { e.preventDefault(); handle(); }} disabled={busy}>
            {busy ? 'Salvando...' : inativar ? 'Inativar' : 'Ativar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
