// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mocka createClient para capturar as opções passadas (sem cliente/rede reais).
const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn((..._args: unknown[]) => ({ auth: {} })) }));
vi.mock('@supabase/supabase-js', () => ({ createClient: createClientMock }));

beforeEach(() => {
  vi.resetModules();
  createClientMock.mockClear();
  window.localStorage.clear();
  window.sessionStorage.clear();
  vi.stubEnv('VITE_SUPABASE_URL', 'https://x.supabase.co');
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'anon-key');
});
afterEach(() => { vi.unstubAllEnvs(); });

describe('cliente Supabase — sessão por aba', () => {
  it('usa sessionStorage adapter e mantém persistSession/autoRefreshToken', async () => {
    await import('@/integrations/supabase/client');

    expect(createClientMock).toHaveBeenCalledTimes(1);
    const opts = createClientMock.mock.calls[0][2] as { auth: Record<string, unknown> };
    expect(opts.auth.persistSession).toBe(true);
    expect(opts.auth.autoRefreshToken).toBe(true);
    expect(opts.auth.storage).toBeDefined();
  });

  it('o storage do cliente escreve em sessionStorage, não em localStorage', async () => {
    await import('@/integrations/supabase/client');
    const opts = createClientMock.mock.calls[0][2] as { auth: { storage: { setItem: (k: string, v: string) => void } } };

    opts.auth.storage.setItem('sb-x-auth-token', 'tok');
    expect(window.sessionStorage.getItem('sb-x-auth-token')).toBe('tok');
    expect(window.localStorage.getItem('sb-x-auth-token')).toBeNull();
  });
});
