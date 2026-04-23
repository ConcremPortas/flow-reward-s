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
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) setProfile(JSON.parse(stored));
    } catch {
      localStorage.removeItem(SESSION_KEY);
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any

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

  const signOut = () => {
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
