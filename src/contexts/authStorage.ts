// Persistência de AUTENTICAÇÃO por SESSÃO DE ABA (sessionStorage).
//
// Decisão: a sessão (perfil no modo custom; tokens no modo Supabase) vive em
// sessionStorage — isolada por aba e eliminada quando a aba é fechada. NUNCA em
// localStorage (que persiste entre fechamentos e é compartilhado entre abas).
//
// Este módulo é a ÚNICA fonte de acesso ao storage de auth. É um "leaf" (não
// importa client/AuthContext) para evitar ciclos e ser testável isoladamente.
//
// SEGURANÇA: sessionStorage continua acessível por JavaScript da origem — não é
// cookie HttpOnly. Protege contra persistência/compartilhamento entre abas, NÃO
// contra XSS. Autorização crítica permanece no servidor (RLS/RPC).

/** Chave do perfil no modo custom (mantida por compatibilidade de nome). */
export const SESSION_KEY = 'concremrh_session';

/** Acesso seguro ao sessionStorage (SSR / navegador sem storage / modo restrito). */
function safeSessionStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Acesso seguro ao localStorage (usado só na limpeza de legado). */
function safeLocalStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

// Fallback em memória (SSR/ambiente sem window) — evita quebrar fora do navegador.
const memory = new Map<string, string>();

/**
 * Storage adapter para o cliente Supabase: usa sessionStorage (sessão por aba),
 * com fallback em memória quando não há window. Interface síncrona esperada pelo
 * supabase-js (getItem/setItem/removeItem).
 */
export const sessionStorageAdapter = {
  getItem: (key: string): string | null => {
    const s = safeSessionStorage();
    return s ? s.getItem(key) : (memory.get(key) ?? null);
  },
  setItem: (key: string, value: string): void => {
    const s = safeSessionStorage();
    if (s) s.setItem(key, value); else memory.set(key, value);
  },
  removeItem: (key: string): void => {
    const s = safeSessionStorage();
    if (s) s.removeItem(key); else memory.delete(key);
  },
};

// ── Sessão do modo custom (perfil serializado) ──────────────────────────────
export function saveCustomSession(profileJson: string): void {
  sessionStorageAdapter.setItem(SESSION_KEY, profileJson);
}
export function loadCustomSession(): string | null {
  return sessionStorageAdapter.getItem(SESSION_KEY);
}
export function clearCustomSession(): void {
  sessionStorageAdapter.removeItem(SESSION_KEY);
}

/**
 * Remove APENAS sessões de autenticação LEGADAS do localStorage (migração para
 * sessão por aba). Idempotente e limitada: não usa localStorage.clear() e não
 * toca em preferências (tema, sidebar, filtros, flag de intro, etc.).
 * Remove:
 *   - concremrh_session (perfil custom legado);
 *   - sb-<ref>-auth-token e supabase.auth.token (tokens do Supabase Auth legados).
 */
export function purgeLegacyAuthStorage(): void {
  const ls = safeLocalStorage();
  if (!ls) return;
  try {
    ls.removeItem(SESSION_KEY);
    ls.removeItem('supabase.auth.token');
    // Varre só as chaves de token do Supabase Auth (sb-*-auth-token), sem afetar outras.
    const alvos: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const key = ls.key(i);
      if (key && /^sb-.*-auth-token$/.test(key)) alvos.push(key);
    }
    for (const key of alvos) ls.removeItem(key);
  } catch {
    /* storage indisponível: nada a limpar */
  }
}
