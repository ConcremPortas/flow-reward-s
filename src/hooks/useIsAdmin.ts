import { useAuth } from '@/contexts/AuthContext';

/**
 * Retorna `true` somente quando o usuário autenticado tem perfil 'admin'.
 * Fonte única de verdade para gatear ações destrutivas (ex.: exclusão) na UI.
 * A restrição real é reforçada no banco (RLS/RPC) — este helper é a camada de UI.
 */
export function useIsAdmin(): boolean {
  const { profile } = useAuth();
  return profile?.perfil === 'admin';
}
