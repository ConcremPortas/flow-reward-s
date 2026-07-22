import { useEffect, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  adminEmail: string;
  title: string;
  description: string;
  actionLabel: string;
  /** Executa a ação sensível com a senha do admin. Deve LANÇAR em caso de erro
   *  (a mensagem é exibida). A validação real ocorre no servidor (RPC). */
  onConfirm: (adminSenha: string) => Promise<void>;
}

/**
 * Reautenticação administrativa — centralizada (não duplicar). Coleta a senha do
 * administrador logado e a repassa à ação, que chama a RPC endurecida (validação
 * server-side: usuário autenticado + perfil admin + bcrypt da senha). A senha
 * NUNCA é logada, persistida ou colocada em estado global; é limpa ao fechar.
 */
export function AdminReauthenticationDialog({ open, onOpenChange, adminEmail, title, description, actionLabel, onConfirm }: Props) {
  const [senha, setSenha] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (!open) { setSenha(''); setError(null); setBusy(false); } }, [open]);

  const handle = async () => {
    if (busy || !senha) return;
    setBusy(true); setError(null);
    try {
      await onConfirm(senha);
      setSenha('');
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível concluir a operação.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) onOpenChange(o); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-status-warning" /> {title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Administrador</Label>
            <Input value={adminEmail} readOnly disabled className="bg-muted/40" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reauth-senha">Sua senha de administrador *</Label>
            <Input id="reauth-senha" type="password" autoComplete="current-password" value={senha}
              onChange={(e) => setSenha(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handle(); }} autoFocus />
            <p className="text-[11px] text-muted-foreground">A confirmação é validada no servidor. A senha não é armazenada.</p>
          </div>
          {error && <p className="rounded-lg border border-destructive/40 bg-destructive/5 p-2 text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>Cancelar</Button>
          <Button onClick={handle} disabled={busy || !senha} className="gap-1.5">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}{actionLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
