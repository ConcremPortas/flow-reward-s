import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { useHRApplications } from '@/hooks/useHRApplications';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { Trophy, Briefcase, BarChart3, Lock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const iconMap: Record<string, any> = {
  Trophy,
  Briefcase,
  BarChart3,
};

export default function HubRH() {
  const navigate = useNavigate();
  const { applications, loading: appsLoading } = useHRApplications();
  const [userId, setUserId] = useState<string | null>(null);
  const { isAdmin, loading: permLoading } = useUserPermissions(userId || undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });
  }, []);

  const loading = appsLoading || permLoading;

  const handleAppClick = (route: string, code: string) => {
    // For now, admins can access everything
    // TODO: Implement proper permission checking
    if (isAdmin || code === 'premiacoes') {
      navigate(route);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Skeleton className="h-12 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Hub de Aplicações RH
          </h1>
          <p className="text-muted-foreground text-lg">
            Selecione uma aplicação para acessar
          </p>
        </div>

        {/* Applications Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {applications.map((app) => {
            const IconComponent = iconMap[app.icon || 'Trophy'];
            const hasAccess = isAdmin || app.code === 'premiacoes';

            return (
              <Card
                key={app.id}
                className={`relative group overflow-hidden transition-all duration-300 hover:scale-105 ${
                  hasAccess 
                    ? 'cursor-pointer hover:shadow-2xl' 
                    : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => hasAccess && handleAppClick(app.route, app.code)}
              >
                {/* Color accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-2"
                  style={{ backgroundColor: app.color || '#10b981' }}
                />

                {/* Lock overlay for restricted apps */}
                {!hasAccess && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center">
                      <Lock className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground font-medium">
                        Acesso Restrito
                      </p>
                    </div>
                  </div>
                )}

                <div className="p-8">
                  {/* Icon */}
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${app.color || '#10b981'}20` }}
                  >
                    {IconComponent && (
                      <IconComponent
                        className="w-8 h-8"
                        style={{ color: app.color || '#10b981' }}
                      />
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-foreground mb-3">
                    {app.name}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {app.description || 'Sem descrição'}
                  </p>
                </div>

                {/* Bottom gradient */}
                <div
                  className="absolute bottom-0 left-0 right-0 h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${
                      app.color || '#10b981'
                    }, transparent)`,
                  }}
                />
              </Card>
            );
          })}
        </div>

        {/* Footer info */}
        {!isAdmin && (
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Entre em contato com o administrador para solicitar acesso às outras aplicações
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
