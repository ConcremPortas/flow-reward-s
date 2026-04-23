import { Navigate } from 'react-router-dom';
import { useAuth, UserPerfil, DEFAULT_ROUTE } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedPerfis?: UserPerfil[];
}

export function ProtectedRoute({ children, allowedPerfis }: ProtectedRouteProps) {
  const { profile, loading } = useAuth();

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

  return <>{children}</>;
}
