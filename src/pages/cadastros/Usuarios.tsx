import { UsersShell } from '@/features/users/components/UsersShell';

/**
 * Rota /cadastros/usuarios (admin-only via ProtectedRoute) — Central de Usuários e
 * Acessos. A orquestração vive na feature `users`; esta página apenas monta o
 * shell. Reusa os fluxos seguros existentes (RPCs endurecidas + reautenticação);
 * não altera AuthContext, RLS nem o motor de premiação. Nunca lê/expõe senha_hash.
 */
export default function Usuarios() {
  return <UsersShell />;
}
