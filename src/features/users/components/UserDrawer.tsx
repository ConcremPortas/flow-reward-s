import { Pencil, ShieldCheck, KeyRound, UserX, UserCheck, AlertTriangle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { formatDateTimeBR } from '@/lib/dateTime';
import { sectionLabel } from '../domain/permissionDefinitions';
import { accessSummary } from '../domain/userAccess';
import { canDeactivate, canActivate } from '../domain/userSecurityRules';
import { UserProfileBadge } from './UserProfileBadge';
import { UserStatus } from './UserStatus';
import { UserAuthStatus } from './UserAuthStatus';
import type { UserRow } from '../types/user.types';
import type { UserSecInput } from '../domain/userSecurityRules';

interface Props {
  row: UserRow | null;
  secInputs: UserSecInput[];
  currentUserId: string | null;
  onClose: () => void;
  onEdit: (r: UserRow) => void;
  onEditAccess: (r: UserRow) => void;
  onResetPassword: (r: UserRow) => void;
  onActivate: (r: UserRow) => void;
  onDeactivate: (r: UserRow) => void;
}

export function UserDrawer({ row, secInputs, currentUserId, onClose, onEdit, onEditAccess, onResetPassword, onActivate, onDeactivate }: Props) {
  if (!row) return <Sheet open={false} onOpenChange={() => {}}><SheetContent /></Sheet>;
  const r = row;
  const target = { id: r.id, perfil: r.perfil, ativo: r.ativo };
  const deact = canDeactivate(target, secInputs, currentUserId);
  const act = canActivate(target);

  return (
    <Sheet open={!!row} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[520px]">
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="flex items-center gap-2 truncate">{r.nome ?? '(sem nome)'}{r.isSelf && <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Você</span>}</SheetTitle>
          <p className="text-sm text-muted-foreground">{r.email}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <UserProfileBadge perfil={r.perfil} /><UserStatus ativo={r.ativo} /><UserAuthStatus state={r.authState} />
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <Section label="Acesso">
            <p className="text-sm font-medium text-foreground">{accessSummary(r.access)}</p>
            {r.access.kind === 'total' ? (
              <p className="mt-0.5 text-xs text-muted-foreground">Administrador — acesso total a todas as seções.</p>
            ) : r.access.conhecidas.length > 0 ? (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {r.access.conhecidas.map(s => <span key={s} className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground">{sectionLabel(s)}</span>)}
              </div>
            ) : <p className="mt-0.5 text-xs text-muted-foreground">Nenhuma seção atribuída.</p>}
          </Section>

          {r.access.desconhecidas.length > 0 && (
            <div className="rounded-xl border border-status-warning/40 bg-status-warning/5 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-status-warning"><AlertTriangle className="h-3.5 w-3.5" /> Permissões a revisar</p>
              <p className="mt-1 text-sm text-foreground">{r.access.desconhecidas.join(', ')}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Valores não reconhecidos no registro oficial. Podem pertencer a outro módulo — não removidos automaticamente.</p>
            </div>
          )}

          <Section label="Autenticação">
            <p className="text-sm text-foreground">{r.authState.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{r.authState.descricao}</p>
          </Section>

          <Section label="Metadados">
            <p className="text-sm text-muted-foreground">Criado em {r.createdAt ? formatDateTimeBR(r.createdAt) : '—'}.</p>
            {r.isLastActiveAdmin && <p className="mt-1 text-xs text-status-warning">Último administrador ativo — protegido contra desativação e rebaixamento.</p>}
          </Section>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-border/60 px-5 py-3">
          <Button variant="outline" className="justify-start gap-2" onClick={() => onEdit(r)}><Pencil className="h-4 w-4" /> Editar</Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => onEditAccess(r)}><ShieldCheck className="h-4 w-4" /> Acessos</Button>
          <Button variant="outline" className="justify-start gap-2" onClick={() => onResetPassword(r)}><KeyRound className="h-4 w-4" /> Redefinir senha</Button>
          {r.ativo ? (
            <Button variant="outline" className="justify-start gap-2 text-destructive" disabled={!deact.allowed} onClick={() => onDeactivate(r)}><UserX className="h-4 w-4" /> Desativar</Button>
          ) : (
            <Button variant="outline" className="justify-start gap-2" disabled={!act.allowed} onClick={() => onActivate(r)}><UserCheck className="h-4 w-4" /> Ativar</Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="rounded-lg border border-border/70 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><div className="mt-1.5">{children}</div></div>;
}
