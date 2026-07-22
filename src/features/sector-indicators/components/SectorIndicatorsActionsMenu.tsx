import { useState } from 'react';
import { MoreHorizontal, Eye, Pencil, BarChart3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Props {
  setorNome: string;
  competenciaLabel: string;
  onView: () => void;
  onEdit: () => void;
  onViewIndicadoresGerais: () => void;
  onDelete: () => Promise<void> | void;
}

/** Menu de contexto do histórico. Excluir é separado, perigoso, com confirmação e bloqueio de duplo envio. */
export function SectorIndicatorsActionsMenu({ setorNome, competenciaLabel, onView, onEdit, onViewIndicadoresGerais, onDelete }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      await onDelete();
      setConfirmOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Ações de ${setorNome} em ${competenciaLabel}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={onView}><Eye className="mr-2 h-4 w-4" /> Ver detalhes</DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit}><Pencil className="mr-2 h-4 w-4" /> Editar apuração</DropdownMenuItem>
          <DropdownMenuItem onClick={onViewIndicadoresGerais}><BarChart3 className="mr-2 h-4 w-4" /> Ver Indicadores Gerais</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setConfirmOpen(true)} className="text-destructive focus:text-destructive">
            <Trash2 className="mr-2 h-4 w-4" /> Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={confirmOpen} onOpenChange={(o) => { if (!deleting) setConfirmOpen(o); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir apuração de indicadores</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir os indicadores de <strong>{setorNome}</strong> em <strong>{competenciaLabel}</strong> remove o dado
              permanentemente e afeta o cálculo de premiação dos funcionários do setor nessa competência. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
