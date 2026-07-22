import { useState } from 'react';
import { X, CheckCheck, RotateCcw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  count: number;
  hasNaoConformesSelected: boolean;
  filteringSelected: boolean;
  onMarkConforme: () => void;
  onRestore: () => void;
  onToggleFilterSelected: () => void;
  onClear: () => void;
}

/** Barra contextual de seleção em massa. Sobrescrever não conformidades exige confirmação. */
export function EpiBulkBar({ count, hasNaoConformesSelected, filteringSelected, onMarkConforme, onRestore, onToggleFilterSelected, onClear }: Props) {
  const [confirmMarkConforme, setConfirmMarkConforme] = useState(false);
  if (count === 0) return null;

  const handleMarkConforme = () => {
    if (hasNaoConformesSelected) setConfirmMarkConforme(true);
    else onMarkConforme();
  };

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3">
      <span className="text-sm font-semibold text-foreground">{count} selecionado(s)</span>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleMarkConforme}>
          <CheckCheck className="h-3.5 w-3.5" /> Marcar como conforme
        </Button>
        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={onRestore}>
          <RotateCcw className="h-3.5 w-3.5" /> Restaurar
        </Button>
        <Button variant={filteringSelected ? 'default' : 'outline'} size="sm" className="h-8 gap-1.5" onClick={onToggleFilterSelected}>
          <Filter className="h-3.5 w-3.5" /> {filteringSelected ? 'Ver todos' : 'Filtrar selecionados'}
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear} aria-label="Cancelar seleção"><X className="h-4 w-4" /></Button>
      </div>

      <AlertDialog open={confirmMarkConforme} onOpenChange={setConfirmMarkConforme}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sobrescrever {count} funcionário(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Alguns dos selecionados estão marcados como não conforme. Marcar como conforme substituirá essa marcação no rascunho — a alteração só é persistida ao salvar a auditoria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onMarkConforme(); setConfirmMarkConforme(false); }}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
