import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useHRApplications } from '@/hooks/useHRApplications';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { Trophy, Briefcase, BarChart3, LogOut, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import logoImage from "@/assets/logo-concrem-new.png";

const iconMap: Record<string, any> = {
  Trophy,
  Briefcase,
  BarChart3,
};

export default function HubRH() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { applications, loading: appsLoading } = useHRApplications();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');
  const { isAdmin, loading: permLoading } = useUserPermissions(userId || undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
      setUserEmail(session?.user?.email || '');
    });
  }, []);

  const loading = appsLoading || permLoading;

  const handleAppClick = (route: string, code: string) => {
    if (isAdmin || code === 'premiacoes') {
      navigate(route);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast({
        title: "Logout realizado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro ao fazer logout",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-red-500 to-purple-600">
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
        <div className="relative z-10">
          <header className="bg-background/95 backdrop-blur-sm border-b border-border">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
              <Skeleton className="h-12 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
          </header>
          <div className="container mx-auto px-6 py-16">
            <div className="text-center mb-16">
              <Skeleton className="h-12 w-96 mx-auto mb-4" />
              <Skeleton className="h-6 w-72 mx-auto" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-80" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-red-500 to-purple-600 relative">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-20">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <img src={logoImage} alt="Logo" className="h-12" />
              <div>
                <h1 className="text-xl font-bold text-foreground">Concrem</h1>
                <p className="text-sm text-muted-foreground">Sistema de Gestão Integrada</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {isAdmin ? 'Administrador' : 'Usuário'}
                </p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-16">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
              Bem-vindo ao Hub de Aplicações
            </h2>
            <p className="text-xl text-white/90 drop-shadow">
              Selecione o módulo que deseja acessar
            </p>
          </div>

          {/* Applications Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-8">
            {applications.map((app) => {
              const IconComponent = iconMap[app.icon || 'Trophy'];
              const hasAccess = isAdmin || app.code === 'premiacoes';

              return (
                <Card
                  key={app.id}
                  className="relative overflow-hidden backdrop-blur-md bg-white/90 border-white/20 shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-3xl"
                >
                  <div className="p-8">
                    {/* Icon */}
                    <div
                      className="w-16 h-16 rounded-xl flex items-center justify-center mb-6"
                      style={{ backgroundColor: app.color || '#10b981' }}
                    >
                      {IconComponent && (
                        <IconComponent className="w-8 h-8 text-white" />
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-foreground mb-3">
                      {app.name}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                      {app.description || 'Sem descrição'}
                    </p>

                    {/* Action */}
                    {hasAccess ? (
                      <Button
                        className="w-full"
                        style={{ backgroundColor: app.color || '#10b981' }}
                        onClick={() => handleAppClick(app.route, app.code)}
                      >
                        Acessar Módulo
                      </Button>
                    ) : (
                      <Badge variant="secondary" className="w-full py-2 justify-center">
                        Em breve
                      </Badge>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Info Card */}
          {applications.some(app => !isAdmin && app.code !== 'premiacoes') && (
            <Card className="max-w-6xl mx-auto backdrop-blur-md bg-white/90 border-white/20 shadow-xl">
              <div className="p-6 flex gap-4">
                <Info className="w-6 h-6 text-orange-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Novos módulos em desenvolvimento
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Os módulos de Cargos e Salários e Indicadores RH estão sendo desenvolvidos e estarão disponíveis em breve. 
                    O módulo de Premiações já está completo e pronto para uso.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </main>

        {/* Footer */}
        <footer className="text-center py-8">
          <p className="text-sm text-white/80 drop-shadow">
            {new Date().getFullYear()} - Desenvolvido por Infinity Inteligência e Inovação
          </p>
        </footer>
      </div>
    </div>
  );
}
