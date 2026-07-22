import { MoreHorizontal, Eye, Pencil, Copy, GitCompare, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useIsAdmin } from '@/hooks/useIsAdmin';

interface Props {
  nome: string;
  temUso: boolean;
  onDetails: () => void;
  onEdit: () => void;
  onDuplicar: () => void;
  onComparar: () => void;
  onVerUtilizacao: () => void;
  onDelete: () => void;
}

export function RewardFormulaActionsMenu({ nome, temUso, onDetails, onEdit, onDuplicar, onComparar, onVerUtilizacao, onDelete }: Props) {
  const isAdmin = useIsAdmin();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Ações da fórmula ${nome}`}><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={onDetails}><Eye className="mr-2 h-4 w-4" /> Ver detalhes</DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}><Pencil className="mr-2 h-4 w-4" /> Editar fórmula</DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicar}><Copy className="mr-2 h-4 w-4" /> Duplicar fórmula</DropdownMenuItem>
        <DropdownMenuItem onClick={onComparar}><GitCompare className="mr-2 h-4 w-4" /> Comparar</DropdownMenuItem>
        {temUso && <DropdownMenuItem onClick={onVerUtilizacao}><Users className="mr-2 h-4 w-4" /> Ver utilização</DropdownMenuItem>}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir fórmula</DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
