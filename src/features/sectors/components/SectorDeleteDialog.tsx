import { useState } from 'react';
import { Users } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { pluralizeBR } from '@/lib/formatters';
import type { SectorRow } from '../types/sector.types';

interface Props {
  row: SectorRow | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (r: SectorRow) => Promise<void>;
  onVerFuncionarios: (r: SectorRow) => void;
}

/**
 * Exclusão sensível: audita dependências (em lote, já carregadas) e mostra o
 * impacto. A exclusão é SOFT (desativa o setor) — preservada; por isso não há
 * bloqueio de FK, mas os vínculos são exibidos para decisão consciente.
 */
export function SectorDeleteDialog({ row, onOpenChange, onConfirm, onVerFuncionarios }: Props) {
  const [deleting, setDeleting] = useState(false);
  if (!row) return null;
  const { funcionarios, producao, indicadores } = row.links;
  const temVinculos = funcionarios > 0 || producao > 0 || indicadores > 0;

  const handle = async () => {
    if (deleting) return;
    setDeleting(true);
    try { await onConfirm(row); onOpenChange(false); } finally { setDeleting(false); }
  };

  return (
    <AlertDialog open={!!row} onOpenChange={(o) => { if (!deleting) onOpenChange(o); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir setor</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p><strong>{row.nome}</strong>{row.empresaNome ? ` · ${row.empresaNome}` : ''}</p>
              {temVinculos ? (
                <>
                  <p>Este setor possui:</p>
                  <ul className="ml-4 list-disc space-y-0.5">
                    {funcionarios > 0 && <li>{pluralizeBR(funcionarios, 'funcionário vinculado', 'funcionários vinculados')}</li>}
                    {producao > 0 && <li>{pluralizeBR(producao, 'registro de produção', 'registros de produção')}</li>}
                    {indicadores > 0 && <li>{pluralizeBR(indicadores, 'registro de indicadores', 'registros de indicadores')}</li>}
                  </ul>
                  <p className="text-status-warning">A exclusão desativa o setor e pode afetar dados relacionados.</p>
                </>
              ) : (
                <p>Este setor não possui vínculos. A exclusão o desativará.</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-wrap gap-2">
          {funcionarios > 0 && (
            <Button variant="outline" className="mr-auto gap-1.5" onClick={() => { onOpenChange(false); onVerFuncionarios(row); }}>
              <Users className="h-4 w-4" /> Ver funcionários
            </Button>
          )}
          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handle} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {deleting ? 'Excluindo...' : 'Excluir setor'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
