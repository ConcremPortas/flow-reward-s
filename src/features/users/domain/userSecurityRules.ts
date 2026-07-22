// Regras de segurança de DOMÍNIO — PURAS. São guardas de UI (defesa em
// profundidade): impedem que a interface tente ações perigosas. A autoridade
// final é o servidor (página admin-only via ProtectedRoute + RLS; criação/reset
// via RPC com reautenticação). A proteção definitiva de "último administrador" e
// de promoção/rebaixamento deveria ser reforçada por RPC no servidor
// (recomendação — não implementada aqui para não alterar o banco).

export interface UserSecInput { id: string; perfil: string; ativo: boolean }
export interface GuardResult { allowed: boolean; reason?: string }

export function countActiveAdmins(users: UserSecInput[]): number {
  return users.filter(u => u.perfil === 'admin' && u.ativo).length;
}

export function isLastActiveAdmin(user: UserSecInput, users: UserSecInput[]): boolean {
  return user.perfil === 'admin' && user.ativo && countActiveAdmins(users) <= 1;
}

/** Pode desativar? Bloqueia autodesativação e último admin ativo. */
export function canDeactivate(target: UserSecInput, users: UserSecInput[], currentUserId: string | null): GuardResult {
  if (!target.ativo) return { allowed: false, reason: 'A conta já está inativa.' };
  if (target.id === currentUserId) return { allowed: false, reason: 'Você não pode desativar a própria conta.' };
  if (isLastActiveAdmin(target, users)) return { allowed: false, reason: 'Não é possível desativar o último administrador ativo.' };
  return { allowed: true };
}

export function canActivate(target: UserSecInput): GuardResult {
  return target.ativo ? { allowed: false, reason: 'A conta já está ativa.' } : { allowed: true };
}

/** Pode alterar o perfil para `novoPerfil`? Protege último admin e autorrebaixamento. */
export function canChangePerfil(target: UserSecInput, novoPerfil: string, users: UserSecInput[], currentUserId: string | null): GuardResult {
  const saindoDeAdmin = target.perfil === 'admin' && novoPerfil !== 'admin';
  if (saindoDeAdmin && target.id === currentUserId) return { allowed: false, reason: 'Você não pode rebaixar a própria conta de administrador.' };
  if (saindoDeAdmin && isLastActiveAdmin(target, users)) return { allowed: false, reason: 'Não é possível rebaixar o último administrador ativo.' };
  return { allowed: true };
}

/** Editar acessos (secoes): admins ignoram secoes (acesso total) — apenas informativo. */
export function accessEditNote(target: UserSecInput): string | null {
  return target.perfil === 'admin' ? 'Administradores têm acesso total; as seções não se aplicam.' : null;
}
