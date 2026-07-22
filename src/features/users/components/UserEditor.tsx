import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { CREATABLE_PERFIS, PERFIL_LABEL } from '../domain/permissionDefinitions';
import { KNOWN_SECTIONS } from '../domain/userAccess';
import { isValidEmail, isValidNome, normalizeEmail, normalizeNome, emailEmUso } from '../domain/userValidation';
import { canChangePerfil } from '../domain/userSecurityRules';
import type { UserSecInput } from '../domain/userSecurityRules';
import { UserAccessEditor } from './UserAccessEditor';
import { AdminReauthenticationDialog } from './AdminReauthenticationDialog';
import type { UserRow } from '../types/user.types';
import type { SectionKey } from '@/contexts/AuthContext';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: UserRow | null;      // null = criação
  usuarios: { id: string; email: string }[];
  secInputs: UserSecInput[];
  currentUserId: string | null;
  adminEmail: string;
  onCreate: (p: { nome: string; email: string; senha: string; perfil: string; secoes: string[]; adminSenha: string }) => Promise<void>;
  onUpdate: (id: string, p: { nome?: string; perfil?: string; secoes?: string[] }) => Promise<void>;
}

/** Criação em 2 etapas (Identidade → Perfil e Acessos → reauth) ou edição de
 *  identidade/perfil. E-mail é BLOQUEADO na edição (sincronização com auth.users
 *  não é segura neste fluxo). Criação usa a RPC endurecida + reautenticação. */
export function UserEditor({ open, onOpenChange, editing, usuarios, secInputs, currentUserId, adminEmail, onCreate, onUpdate }: Props) {
  const isEdit = !!editing;
  const [step, setStep] = useState<1 | 2>(1);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [perfil, setPerfil] = useState<string>('rh');
  const [secoes, setSecoes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [reauthOpen, setReauthOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep(1); setSaving(false);
    setNome(editing?.nome ?? '');
    setEmail(editing?.email ?? '');
    setSenha('');
    setPerfil(editing?.perfil ?? 'rh');
    setSecoes(editing ? [...editing.secoes] : []);
  }, [open, editing]);

  const perfilChange = useMemo(
    () => (isEdit ? canChangePerfil({ id: editing!.id, perfil: editing!.perfil, ativo: editing!.ativo }, perfil, secInputs, currentUserId) : { allowed: true }),
    [isEdit, editing, perfil, secInputs, currentUserId],
  );
  const emailDup = !isEdit && email.trim() !== '' && emailEmUso(email, usuarios);
  const identidadeOk = isValidNome(nome) && (isEdit || (isValidEmail(email) && senha.length >= 6 && !emailDup));

  const handleUpdate = async () => {
    if (!identidadeOk || !perfilChange.allowed || saving) return;
    setSaving(true);
    try {
      await onUpdate(editing!.id, { nome: normalizeNome(nome), perfil, secoes: perfil === 'admin' ? [...KNOWN_SECTIONS] : (secoes as SectionKey[]) });
      onOpenChange(false);
    } finally { setSaving(false); }
  };

  const doCreate = async (adminSenha: string) => {
    await onCreate({
      nome: normalizeNome(nome), email: normalizeEmail(email), senha, perfil,
      secoes: perfil === 'admin' ? [...KNOWN_SECTIONS] : secoes, adminSenha,
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
            <DialogDescription>{isEdit ? 'Identidade e perfil. Acessos são editados separadamente.' : 'Identificação, perfil e acessos.'}</DialogDescription>
          </DialogHeader>

          {!isEdit && (
            <div className="flex items-center gap-2">
              {(['Identificação', 'Perfil e acessos'] as const).map((label, i) => {
                const n = (i + 1) as 1 | 2; const active = step === n;
                return (
                  <div key={label} className={cn('flex flex-1 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium', active ? 'border-[#08783e] bg-[#08783e]/10 text-[#08783e]' : 'border-border/60 text-muted-foreground')}>
                    <span className={cn('flex h-5 w-5 items-center justify-center rounded-full text-[11px]', active ? 'bg-[#08783e] text-white' : 'bg-muted text-muted-foreground')}>{n}</span>{label}
                  </div>
                );
              })}
            </div>
          )}

          <div className="max-h-[58vh] space-y-3 overflow-y-auto pr-1">
            {(isEdit || step === 1) && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="u-nome">Nome *</Label>
                  <Input id="u-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" autoFocus />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="u-email">E-mail *</Label>
                  <Input id="u-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isEdit} className={cn(isEdit && 'bg-muted/40', emailDup && 'border-destructive')} placeholder="email@empresa.com" />
                  {isEdit && <p className="text-[11px] text-muted-foreground">A alteração de e-mail está bloqueada (sincronização com a autenticação não é segura por esta tela).</p>}
                  {emailDup && <p className="text-xs text-destructive">Já existe um usuário com este e-mail.</p>}
                </div>
                {!isEdit && (
                  <div className="space-y-1.5">
                    <Label htmlFor="u-senha">Senha inicial *</Label>
                    <Input id="u-senha" type="password" autoComplete="new-password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Mínimo 6 caracteres" />
                    <p className="text-[11px] text-muted-foreground">Definida via fluxo seguro (RPC). Nunca é registrada nem exibida.</p>
                  </div>
                )}
              </>
            )}

            {(isEdit || step === 2) && (
              <>
                <div className="space-y-1.5">
                  <Label>Perfil *</Label>
                  <Select value={perfil} onValueChange={setPerfil}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CREATABLE_PERFIS.map(p => <SelectItem key={p} value={p}>{PERFIL_LABEL[p]}</SelectItem>)}</SelectContent>
                  </Select>
                  {isEdit && perfil === 'admin' && editing!.perfil !== 'admin' && (
                    <p className="flex items-start gap-1.5 text-xs text-status-warning"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Promover a administrador concede acesso total ao sistema.</p>
                  )}
                  {isEdit && !perfilChange.allowed && <p className="text-xs text-destructive">{perfilChange.reason}</p>}
                </div>
                <UserAccessEditor perfil={perfil} secoes={secoes} onChange={setSecoes} desconhecidas={editing?.access.desconhecidas ?? []} />
              </>
            )}
          </div>

          <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
            <div>{!isEdit && step === 2 && <Button variant="outline" className="gap-1.5" onClick={() => setStep(1)} disabled={saving}><ChevronLeft className="h-4 w-4" /> Voltar</Button>}</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
              {isEdit ? (
                <Button className="gap-1.5" onClick={handleUpdate} disabled={!identidadeOk || !perfilChange.allowed || saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar
                </Button>
              ) : step === 1 ? (
                <Button className="gap-1.5" onClick={() => setStep(2)} disabled={!identidadeOk}>Avançar <ChevronRight className="h-4 w-4" /></Button>
              ) : (
                <Button className="gap-1.5" onClick={() => setReauthOpen(true)}>Criar usuário <ChevronRight className="h-4 w-4" /></Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminReauthenticationDialog
        open={reauthOpen} onOpenChange={setReauthOpen} adminEmail={adminEmail}
        title="Confirmar criação de usuário" description="Informe sua senha de administrador para concluir a criação."
        actionLabel="Criar usuário"
        onConfirm={async (adminSenha) => { await doCreate(adminSenha); onOpenChange(false); }}
      />
    </>
  );
}
