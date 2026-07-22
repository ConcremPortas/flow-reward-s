import { MoreHorizontal, Eye, Pencil, ShieldCheck, KeyRound, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { UserRow } from '../types/user.types';
import { canDeactivate, canActivate } from '../domain/userSecurityRules';
import type { UserSecInput } from '../domain/userSecurityRules';

interface Props {
  row: UserRow;
  secInputs: UserSecInput[];
  currentUserId: string | null;
  onDetails: () => void;
  onEdit: () => void;
  onEditAccess: () => void;
  onResetPassword: () => void;
  onActivate: () => void;
  onDeactivate: () => void;
}

export function UserActionsMenu({ row, secInputs, currentUserId, onDetails, onEdit, onEditAccess, onResetPassword, onActivate, onDeactivate }: Props) {
  const target = { id: row.id, perfil: row.perfil, ativo: row.ativo };
  const deact = canDeactivate(target, secInputs, currentUserId);
  const act = canActivate(target);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Ações de ${row.nome ?? row.email}`}><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={onDetails}><Eye className="mr-2 h-4 w-4" /> Ver detalhes</DropdownMenuItem>
        <DropdownMenuItem onClick={onEdit}><Pencil className="mr-2 h-4 w-4" /> Editar usuário</DropdownMenuItem>
        <DropdownMenuItem onClick={onEditAccess}><ShieldCheck className="mr-2 h-4 w-4" /> Editar acessos</DropdownMenuItem>
        <DropdownMenuItem onClick={onResetPassword}><KeyRound className="mr-2 h-4 w-4" /> Redefinir senha</DropdownMenuItem>
        <DropdownMenuSeparator />
        {row.ativo ? (
          <DropdownMenuItem onClick={onDeactivate} disabled={!deact.allowed} className="text-destructive focus:text-destructive">
            <UserX className="mr-2 h-4 w-4" /> Desativar{!deact.allowed ? ' (protegido)' : ''}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={onActivate} disabled={!act.allowed}><UserCheck className="mr-2 h-4 w-4" /> Ativar</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
