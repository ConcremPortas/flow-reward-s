// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SESSION_KEY, sessionStorageAdapter,
  saveCustomSession, loadCustomSession, clearCustomSession, purgeLegacyAuthStorage,
} from './authStorage';

beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

describe('authStorage — sessão por aba', () => {
  it('adapter grava/lê/remove em sessionStorage, nunca em localStorage', () => {
    sessionStorageAdapter.setItem('sb-x-auth-token', 'tok');
    expect(window.sessionStorage.getItem('sb-x-auth-token')).toBe('tok');
    expect(window.localStorage.getItem('sb-x-auth-token')).toBeNull();
    expect(sessionStorageAdapter.getItem('sb-x-auth-token')).toBe('tok');
    sessionStorageAdapter.removeItem('sb-x-auth-token');
    expect(sessionStorageAdapter.getItem('sb-x-auth-token')).toBeNull();
  });

  it('login custom grava o perfil no sessionStorage e NÃO no localStorage', () => {
    saveCustomSession('{"id":"1","perfil":"rh"}');
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBe('{"id":"1","perfil":"rh"}');
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('inicialização restaura o perfil da mesma aba', () => {
    saveCustomSession('{"id":"1"}');
    expect(loadCustomSession()).toBe('{"id":"1"}');
  });

  it('ausência de sessão na aba retorna null (exige login)', () => {
    expect(loadCustomSession()).toBeNull();
  });

  it('logout remove a sessão da aba', () => {
    saveCustomSession('{"id":"1"}');
    clearCustomSession();
    expect(loadCustomSession()).toBeNull();
    expect(window.sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('perfil adulterado no localStorage NÃO é restaurado (lê só sessionStorage)', () => {
    window.localStorage.setItem(SESSION_KEY, '{"perfil":"admin"}');
    expect(loadCustomSession()).toBeNull();
  });

  describe('purgeLegacyAuthStorage (limpeza de legado)', () => {
    it('remove chaves de auth legadas do localStorage e preserva preferências', () => {
      window.localStorage.setItem(SESSION_KEY, '{"id":"1"}');
      window.localStorage.setItem('sb-ewfebwljhmcvuopopqpb-auth-token', 'tok');
      window.localStorage.setItem('supabase.auth.token', 'old');
      window.localStorage.setItem('theme', 'dark');
      window.localStorage.setItem('recompensa_intro_seen_1', '1');
      window.localStorage.setItem('sidebar:state', 'expanded');

      purgeLegacyAuthStorage();

      expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
      expect(window.localStorage.getItem('sb-ewfebwljhmcvuopopqpb-auth-token')).toBeNull();
      expect(window.localStorage.getItem('supabase.auth.token')).toBeNull();
      // Preferências não relacionadas a auth permanecem intactas.
      expect(window.localStorage.getItem('theme')).toBe('dark');
      expect(window.localStorage.getItem('recompensa_intro_seen_1')).toBe('1');
      expect(window.localStorage.getItem('sidebar:state')).toBe('expanded');
    });

    it('NÃO apaga a sessão atual da aba (sessionStorage)', () => {
      window.sessionStorage.setItem(SESSION_KEY, '{"id":"1"}');
      window.sessionStorage.setItem('sb-ewfebwljhmcvuopopqpb-auth-token', 'tok');
      purgeLegacyAuthStorage();
      expect(window.sessionStorage.getItem(SESSION_KEY)).toBe('{"id":"1"}');
      expect(window.sessionStorage.getItem('sb-ewfebwljhmcvuopopqpb-auth-token')).toBe('tok');
    });

    it('é idempotente e não usa localStorage.clear()', () => {
      const clearSpy = vi.spyOn(Storage.prototype, 'clear');
      window.localStorage.setItem('theme', 'dark');
      purgeLegacyAuthStorage();
      purgeLegacyAuthStorage();
      expect(clearSpy).not.toHaveBeenCalled();
      expect(window.localStorage.getItem('theme')).toBe('dark');
      clearSpy.mockRestore();
    });
  });
});
