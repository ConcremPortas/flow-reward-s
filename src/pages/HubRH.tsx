import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useHRApplications, type HRApplication } from '@/hooks/useHRApplications';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { HubHeader } from '@/components/hub/HubHeader';
import { HubHero } from '@/components/hub/HubHero';
import { HubModuleGrid } from '@/components/hub/HubModuleGrid';
import { HubFooter } from '@/components/hub/HubFooter';

// Wallpaper de floresta da referência (mesma identidade do login). Não trocar.
const WALLPAPER = '/logos/walpaper-concrem.jpg';

/**
 * Fundo em tela cheia: floresta + overlay verde profundo + vinheta discreta.
 * Sem glow/neon/partículas. Cor base escura garante leitura se a imagem falhar.
 */
function HubBackground() {
  return (
    <div className="fixed inset-0 -z-10 bg-[#06140d]">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${WALLPAPER})`, filter: 'brightness(0.72)' }}
      />
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(rgba(1,18,12,0.76), rgba(1,20,14,0.86))' }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_45%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}

export default function HubRH() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { applications, loading } = useHRApplications();
  const { profile, signOut, canAccessHub } = useAuth();

  const isAdmin = profile?.perfil === 'admin';
  const userName = profile?.nome ?? (isAdmin ? 'Administrador' : 'Usuário');

  const handleAccess = (app: HRApplication) => {
    if (canAccessHub(app.code)) navigate(app.route);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
      toast({ title: 'Logout realizado com sucesso' });
    } catch {
      toast({ title: 'Erro ao fazer logout', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <HubBackground />
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full animate-fade-in overflow-x-hidden">
      <HubBackground />
      <div className="relative flex min-h-screen flex-col">
        <HubHeader userName={userName} onLogout={handleLogout} />

        <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-5 py-12 sm:px-8 xl:px-12">
          <div className="flex flex-col gap-12">
            <HubHero />
            <HubModuleGrid applications={applications} canAccess={canAccessHub} onAccess={handleAccess} />
          </div>
        </main>

        <HubFooter />
      </div>
    </div>
  );
}
