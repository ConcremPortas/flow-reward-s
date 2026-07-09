import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type UserPerfil = 'admin' | 'rh' | 'sesmt' | 'producao' | 'custom';

export type SectionKey = 'dashboard' | 'rh' | 'sesmt' | 'producao' | 'premiacoes' | 'cadastros' | 'cargos_salarios';

export const ALL_SECTIONS: SectionKey[] = [
  'dashboard', 'rh', 'sesmt', 'producao', 'premiacoes', 'cadastros', 'cargos_salarios',
];

// Quais seções dão acesso a cada módulo do Hub
export const HUB_MODULE_SECTIONS: Record<string, SectionKey[]> = {
  premiacoes:      ['rh', 'sesmt', 'producao', 'premiacoes'],
  cargos_salarios: ['cargos_salarios'],
  indicadores_rh:  ['dashboard', 'rh'],
};

export interface UserProfile {
  id: string;
  email: string;
  nome: string | null;
  perfil: UserPerfil;
  secoes: SectionKey[];
}

export const DEFAULT_ROUTE: Record<UserPerfil, string> = {
  admin:    '/',
  rh:       '/',
  sesmt:    '/premiacoes/dss',
  producao: '/premiacoes/producao-setor',
  custom:   '/premiacoes/dss',
};

const SESSION_KEY = 'concremrh_session';

// Feature flag da migração de autenticação (Fase 2 — SECURITY_AUTH_MIGRATION_PLAN_V2.md).
// 'custom' (padrão) = comportamento atual (RPC concremrh_verify_login + localStorage).
// 'supabase' = Supabase Auth (signInWithPassword + bridge de senha + get_my_profile).
// Ausente/qualquer outro valor => 'custom' (não quebra o app enquanto a infra da Fase 2 não é aplicada).
export type AuthMode = 'custom' | 'supabase';
export const AUTH_MODE: AuthMode =
  import.meta.env.VITE_AUTH_MODE === 'supabase' ? 'supabase' : 'custom';

// Formato de resposta da RPC get_my_profile() (proposta na Fase 2).
interface GetMyProfileResponse {
  ok: boolean;
  id?: string;
  email?: string;
  nome?: string | null;
  perfil?: string;
  secoes?: string[];
}

// Formato de resposta da Edge Function auth-bridge (proposta na Fase 2).
interface AuthBridgeResponse {
  ok: boolean;
  error?: string;
}

// Monta o UserProfile a partir da sessão do Supabase Auth (via get_my_profile()).
// Usado apenas no modo 'supabase'.
async function fetchSupabaseProfile(): Promise<UserProfile | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('get_my_profile');
  if (error) {
    console.error('get_my_profile error:', error);
    return null;
  }
  const r = data as GetMyProfileResponse;
  if (!r?.ok) return null;
  return {
    id:     r.id!,
    email:  r.email!,
    nome:   r.nome ?? null,
    perfil: (r.perfil ?? 'custom') as UserPerfil,
    secoes: (r.secoes ?? []) as SectionKey[],
  };
}

interface AuthContextType {
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null; profile?: UserProfile | null }>;
  signOut: () => void;
  canAccess: (section: SectionKey) => boolean;
  canAccessHub: (appCode: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (AUTH_MODE === 'supabase') {
      // Modo Supabase Auth: restaura a sessão gerenciada e escuta mudanças.
      let mounted = true;

      // Rede de segurança: o loading NUNCA pode ficar preso (hang de rede/deadlock).
      const safety = setTimeout(() => {
        if (mounted) setLoading(false);
      }, 8000);

      // Carrega o perfil e SEMPRE encerra o loading (sucesso, vazio ou erro).
      const carregarPerfil = async () => {
        try {
          const prof = await fetchSupabaseProfile();
          if (!mounted) return;
          if (prof) {
            setProfile(prof);
          } else {
            // Sessão presente mas perfil não resolveu (token expirado/inválido):
            // limpa a sessão e cai no login, sem travar.
            setProfile(null);
            try { await supabase.auth.signOut(); } catch { /* ignore */ }
          }
        } catch (err) {
          console.error('Erro ao carregar perfil (supabase):', err);
          if (mounted) setProfile(null);
        } finally {
          if (mounted) setLoading(false);
        }
      };

      // IMPORTANTE (supabase-js): NÃO chamar funções async do supabase de dentro
      // do callback do onAuthStateChange — ele roda segurando um lock interno e
      // isso causa DEADLOCK (a promise nunca resolve → spinner infinito no F5).
      // Solução: deferir a chamada para fora do callback com setTimeout(0).
      const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          setProfile(null);
          if (mounted) setLoading(false);
          return;
        }
        setTimeout(() => {
          if (mounted) void carregarPerfil();
        }, 0);
      });

      // Fallback do estado inicial (getSession roda fora de lock, sem deadlock):
      // resolve o caso "sem sessão" rápido; com sessão, o INITIAL_SESSION acima
      // já dispara carregarPerfil.
      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (!mounted) return;
          if (!data.session) setLoading(false);
        })
        .catch((err) => {
          console.error('Erro no getSession inicial (supabase):', err);
          if (mounted) setLoading(false);
        });

      return () => {
        mounted = false;
        clearTimeout(safety);
        sub.subscription.unsubscribe();
      };
    }

    // Modo custom (padrão) — comportamento atual preservado.
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) setProfile(JSON.parse(stored));
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
    setLoading(false);
  }, []);

  // --- Modo custom (padrão): RPC concremrh_verify_login + localStorage. Inalterado. ---
  const signInCustom = async (email: string, password: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('concremrh_verify_login', {
      p_email: email,
      p_password: password,
    });

    if (error) {
      console.error('RPC error:', error);
      return { error: `Erro: ${error.message}` };
    }

    const result = data as { ok: boolean; id?: string; email?: string; nome?: string; perfil?: string; secoes?: string[] };

    if (!result?.ok) return { error: 'Email ou senha inválidos.' };

    const prof: UserProfile = {
      id:     result.id!,
      email:  result.email!,
      nome:   result.nome ?? null,
      perfil: result.perfil as UserPerfil,
      secoes: (result.secoes ?? []) as SectionKey[],
    };

    setProfile(prof);
    localStorage.setItem(SESSION_KEY, JSON.stringify(prof));
    return { error: null, profile: prof };
  };

  // --- Modo supabase: signInWithPassword + bridge de senha (1º login) + get_my_profile. ---
  const signInSupabase = async (email: string, password: string) => {
    let { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Usuário talvez ainda não migrado: tenta o bridge (define a senha no Auth) e repete.
      const { data: bridge, error: bridgeErr } = await supabase.functions.invoke('auth-bridge', {
        body: { email, password },
      });
      const b = bridge as AuthBridgeResponse | null;
      if (bridgeErr || !b?.ok) {
        return { error: 'Email ou senha inválidos.' };
      }
      const retry = await supabase.auth.signInWithPassword({ email, password });
      if (retry.error) return { error: 'Email ou senha inválidos.' };
      error = null;
    }

    const prof = await fetchSupabaseProfile();
    if (!prof) return { error: 'Não foi possível carregar o perfil do usuário.' };

    setProfile(prof);
    return { error: null, profile: prof };
  };

  const signIn = (email: string, password: string) =>
    AUTH_MODE === 'supabase' ? signInSupabase(email, password) : signInCustom(email, password);

  const signOut = () => {
    if (AUTH_MODE === 'supabase') {
      // A sessão é gerenciada pelo Supabase; onAuthStateChange também limpa o profile.
      void supabase.auth.signOut();
      setProfile(null);
      return;
    }
    setProfile(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const canAccess = (section: SectionKey): boolean => {
    if (!profile) return false;
    if (profile.perfil === 'admin') return true;
    return profile.secoes.includes(section);
  };

  const canAccessHub = (appCode: string): boolean => {
    if (!profile) return false;
    if (profile.perfil === 'admin') return true;
    const required = HUB_MODULE_SECTIONS[appCode];
    if (!required) return false;
    return required.some(s => profile.secoes.includes(s));
  };

  return (
    <AuthContext.Provider value={{ profile, loading, signIn, signOut, canAccess, canAccessHub }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
