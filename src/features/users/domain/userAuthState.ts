// Estado de autenticação derivado — PURO. Só expõe estados DETERMINÁVEIS com
// segurança a partir de `auth_user_id` + o modo de auth (AUTH_MODE). Nunca exibe
// o auth_user_id em si.
//
// AUDITORIA: login custom usa RPC (senha_hash/bcrypt) e sessão por aba (sessionStorage); login
// supabase usa Supabase Auth + auth-bridge (define a senha no Auth no 1º login) +
// get_my_profile. `auth_user_id` liga o registro à conta do Supabase Auth.
import type { AuthMode } from '@/contexts/AuthContext';

export type AuthStateKind = 'supabase' | 'legado' | 'migracao_pendente' | 'indeterminado';

export interface AuthState {
  kind: AuthStateKind;
  label: string;
  descricao: string;
}

const META: Record<AuthStateKind, Omit<AuthState, 'kind'>> = {
  supabase: { label: 'Supabase', descricao: 'Conta vinculada ao Supabase Auth.' },
  legado: { label: 'Legado', descricao: 'Autenticação legada (verificação por RPC).' },
  migracao_pendente: { label: 'Migração pendente', descricao: 'Sem vínculo com o Supabase Auth; será criado no primeiro login (bridge).' },
  indeterminado: { label: '—', descricao: 'Estado de autenticação não determinável com segurança.' },
};

export function deriveAuthState(authUserId: string | null | undefined, mode: AuthMode): AuthState {
  const hasLink = !!authUserId;
  let kind: AuthStateKind;
  if (mode === 'supabase') {
    kind = hasLink ? 'supabase' : 'migracao_pendente';
  } else {
    // Modo custom: o login usa a RPC legada independentemente do vínculo.
    kind = 'legado';
  }
  return { kind, ...META[kind] };
}
