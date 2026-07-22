import { useState } from 'react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { canDeactivate, canActivate } from '../domain/userSecurityRules';
import { AUTH_MODE } from '@/contexts/AuthContext';
import type { UserRow } from '../types/user.types';
import type { UserSecInput } from '../domain/userSecurityRules';

interface Props {
  target: { row: UserRow; action: 'ativar' | 'desativar' } | null;
  secInputs: UserSecInput[];
  currentUserId: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (r: UserRow, ativo: boolean) => Promise<void>;
}

/**
 * Ativação/Desativação via diálogo confirmado (sem switch direto). Bloqueia
 * autodesativação e último administrador (guardas de UI). A alteração persiste via
 * update RLS-guardado; enforcement definitivo do "último admin" deve migrar para
 * RPC servidor (recomendação).
 */
export function UserStatusDialog({ target, secInputs, currentUserId, onOpenChange, onConfirm }: Props) {
  const [busy, setBusy] = useState(false);
  if (!target) return null;
  const { row, action } = target;
  const desativar = action === 'desativar';
  const guard = desativar
    ? canDeactivate({ id: row.id, perfil: row.perfil, ativo: row.ativo }, secInputs, currentUserId)
    : canActivate({ id: row.id, perfil: row.perfil, ativo: row.ativo });

  const handle = async () => {
    if (busy || !guard.allowed) return;
    setBusy(true);
    try { await onConfirm(row, !desativar); onOpenChange(false); } finally { setBusy(false); }
  };

  return (
    <AlertDialog open={!!target} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{desativar ? 'Desativar usuário' : 'Ativar usuário'}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2">
              <p><strong>{row.nome ?? row.email}</strong> · {row.email}</p>
              {!guard.allowed ? (
                <p className="text-status-warning">{guard.reason}</p>
              ) : desativar ? (
                <>
                  <p>Ao desativar, o usuário deixa de autenticar {AUTH_MODE === 'supabase' ? '(Supabase Auth e bridge)' : '(login legado)'} — o bloqueio é validado no servidor (RPC filtra <code>ativo = true</code>).</p>
                  <p className="text-muted-foreground">O histórico e os registros são preservados. A conta pode ser reativada depois.</p>
                </>
              ) : (
                <p>Ao ativar, o usuário volta a poder autenticar normalmente.</p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{guard.allowed ? 'Cancelar' : 'Fechar'}</AlertDialogCancel>
          {guard.allowed && (
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handle(); }} disabled={busy}
              className={desativar ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}>
              {busy ? 'Salvando...' : desativar ? 'Desativar' : 'Ativar'}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
