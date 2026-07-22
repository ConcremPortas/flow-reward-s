import { Navigate } from 'react-router-dom';
import { useAuth, UserPerfil, DEFAULT_ROUTE, type SectionKey } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { AccessDenied } from '@/components/AccessDenied';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Restrição por perfil (mantida para as rotas que já usavam). */
  allowedPerfis?: UserPerfil[];
  /** Restrição por SEÇÃO (canAccess — admin sempre passa). Fonte única de acesso ao módulo. */
  section?: SectionKey;
}

export function ProtectedRoute({ children, allowedPerfis, section }: ProtectedRouteProps) {
  const { profile, loading, canAccess } = useAuth();

  // Aguarda a restauração da sessão antes de decidir (evita piscar conteúdo/loop).
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-700" />
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/login" replace />;
  }

  if (allowedPerfis && !allowedPerfis.includes(profile.perfil)) {
    return <Navigate to={DEFAULT_ROUTE[profile.perfil]} replace />;
  }

  // Gate por seção (admin bypassa via canAccess). Sem seção → tela de acesso
  // negado (não redireciona em loop, não usa 404). O servidor é a barreira final.
  if (section && !canAccess(section)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
