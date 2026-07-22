import { useEffect, useState } from 'react';
import { Loader2, KeyRound } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UserRow } from '../types/user.types';

interface Props {
  row: UserRow | null;
  adminEmail: string;
  onOpenChange: (open: boolean) => void;
  /** Chama a RPC endurecida (updateSenha) com a senha nova + senha do admin. */
  onConfirm: (id: string, novaSenha: string, adminSenha: string) => Promise<void>;
}

/**
 * Redefinição de senha (fluxo seguro): coleta a NOVA senha e a senha do
 * ADMINISTRADOR (reautenticação validada no servidor pela RPC). Nunca registra,
 * loga ou expõe senha; não usa service_role; não escreve direto na tabela.
 */
export function UserPasswordResetDialog({ row, adminEmail, onOpenChange, onConfirm }: Props) {
  const [nova, setNova] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [adminSenha, setAdminSenha] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!row) { setNova(''); setConfirmar(''); setAdminSenha(''); setError(null); setBusy(false); } }, [row]);
  if (!row) return null;

  const novaOk = nova.length >= 6;
  const matches = nova === confirmar;
  const canSubmit = novaOk && matches && adminSenha.length > 0 && !busy;

  const handle = async () => {
    if (!canSubmit) return;
    setBusy(true); setError(null);
    try {
      await onConfirm(row.id, nova, adminSenha);
      setNova(''); setConfirmar(''); setAdminSenha('');
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível redefinir a senha.');
    } finally { setBusy(false); }
  };

  return (
    <Dialog open={!!row} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Redefinir senha</DialogTitle>
          <DialogDescription>Defina uma nova senha para <strong>{row.nome ?? row.email}</strong>. Requer confirmação do administrador.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="pr-nova">Nova senha *</Label>
            <Input id="pr-nova" type="password" autoComplete="new-password" value={nova} onChange={(e) => setNova(e.target.value)} placeholder="Mínimo 6 caracteres" />
            {nova && !novaOk && <p className="text-xs text-destructive">A senha deve ter ao menos 6 caracteres.</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pr-conf">Confirmar nova senha *</Label>
            <Input id="pr-conf" type="password" autoComplete="new-password" value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
            {confirmar && !matches && <p className="text-xs text-destructive">As senhas não coincidem.</p>}
          </div>
          <div className="space-y-1.5 rounded-lg border border-border/70 bg-muted/20 p-3">
            <Label htmlFor="pr-admin">Sua senha de administrador ({adminEmail}) *</Label>
            <Input id="pr-admin" type="password" autoComplete="current-password" value={adminSenha} onChange={(e) => setAdminSenha(e.target.value)} />
            <p className="text-[11px] text-muted-foreground">Validada no servidor (RPC). A senha não é armazenada nem registrada.</p>
          </div>
          {error && <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-2 text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={handle} disabled={!canSubmit} className="gap-1.5">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Redefinir senha</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
