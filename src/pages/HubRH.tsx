import { useNavigate } from 'react-router-dom';
import { useHRApplications } from '@/hooks/useHRApplications';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Briefcase, BarChart3, LogOut, Info, ArrowRight, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const WALLPAPER = '/logos/walpaper-concrem.png';
const LOGO_BRANCO = '/logos/Logo-Branco.png';

const iconMap: Record<string, any> = {
  Trophy,
  Briefcase,
  BarChart3,
};

/** Camadas de fundo (mesma identidade da tela de login). */
function HubBackground() {
  return (
    <>
      <div className="fixed inset-0 animate-slow-zoom bg-cover bg-center" style={{ backgroundImage: `url(${WALLPAPER})` }} />
      <div
        className="fixed inset-0"
        style={{
          backgroundImage:
            'radial-gradient(circle at 50% 60%, rgba(34,197,94,0.14), transparent 40%),' +
            'linear-gradient(180deg, rgba(0,0,0,0.55), rgba(0,20,10,0.55), rgba(0,0,0,0.78))',
        }}
      />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_50%_118%,rgba(34,197,94,0.2),transparent_52%)]" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_50%_38%,transparent_52%,rgba(0,0,0,0.55)_100%)]" />
      {/* pattern de pontos (canto inferior esquerdo) */}
      <div
        className="pointer-events-none fixed bottom-10 left-10 z-[1] hidden h-44 w-52 opacity-25 lg:block"
        style={{
          backgroundImage: 'radial-gradient(rgba(52,211,153,0.8) 1.3px, transparent 1.3px)',
          backgroundSize: '18px 18px',
        }}
      />
    </>
  );
}

export default function HubRH() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { applications, loading: appsLoading } = useHRApplications();
  const { profile, signOut, canAccessHub } = useAuth();

  const loading = appsLoading;
  const isAdmin = profile?.perfil === 'admin';
  const userEmail = profile?.email ?? '';

  const handleAppClick = (route: string, code: string) => {
    if (canAccessHub(code)) navigate(route);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
      toast({ title: 'Logout realizado com sucesso' });
    } catch (error) {
      toast({ title: 'Erro ao fazer logout', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden">
        <HubBackground />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
        </div>
      </div>
    );
  }

  const temModuloBloqueado = applications.some((app) => !canAccessHub(app.code));

  return (
    <div className="relative min-h-screen w-full animate-fade-in overflow-hidden">
      <HubBackground />

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Topbar premium */}
        <header className="animate-fade-in border-b border-emerald-500/10 bg-black/25 backdrop-blur-xl">
          <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-4 sm:px-10 xl:px-14">
            <div className="flex items-center gap-3">
              <img src={LOGO_BRANCO} alt="Concrem" className="h-9 w-auto object-contain" />
              <div className="hidden border-l border-white/15 pl-3 sm:block">
                <p className="text-xs text-white/55">Sistema de Gestão Integrada</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight text-white">
                  {profile?.nome ?? (isAdmin ? 'Administrador' : 'Usuário')}
                </p>
                <p className="text-xs text-white/55">{userEmail}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-white/80 transition-all hover:border-white/20 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>

        {/* Conteúdo central */}
        <main className="mx-auto flex w-full max-w-[1440px] flex-1 flex-col justify-center px-6 py-14 sm:px-10 xl:px-14">
          {/* Hero */}
          <div className="mb-14 animate-fade-in-up text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)] md:text-5xl">
              Bem-vindo ao Hub de Aplicações
            </h1>
            <p className="mt-4 text-lg text-white/75">Selecione o módulo que deseja acessar</p>
            <p className="mt-1.5 text-sm text-white/45">
              Gestão integrada para desempenho, cargos e indicadores
            </p>
          </div>

          {/* Cards de módulo */}
          <div className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-7 md:grid-cols-2 lg:grid-cols-3">
            {applications.map((app, i) => {
              const Icon = iconMap[app.icon || 'Trophy'] ?? Trophy;
              const hasAccess = canAccessHub(app.code);
              return (
                <div
                  key={app.id}
                  className="group flex animate-fade-in-up flex-col rounded-3xl p-7 transition-all duration-300 hover:-translate-y-1.5"
                  style={{
                    background: 'rgba(3,20,12,0.72)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(74,222,128,0.18)',
                    boxShadow: '0 25px 70px rgba(0,0,0,0.5), 0 0 45px rgba(34,197,94,0.06)',
                    animationDelay: `${i * 110}ms`,
                  }}
                >
                  {/* Ícone */}
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/25 bg-emerald-500/[0.12] text-emerald-300 shadow-[0_0_26px_-6px_rgba(16,185,129,0.55)] transition-all duration-300 group-hover:border-emerald-400/45 group-hover:text-emerald-200 group-hover:shadow-[0_0_36px_-4px_rgba(16,185,129,0.8)]">
                    {Icon && <Icon className="h-8 w-8" />}
                  </div>

                  <h3 className="text-xl font-bold text-white">{app.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-white/55">
                    {app.description || 'Sem descrição'}
                  </p>

                  {hasAccess ? (
                    <button
                      onClick={() => handleAppClick(app.route, app.code)}
                      className="group/btn mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#16a34a] to-[#2ecc6b] text-sm font-semibold text-white shadow-[0_10px_28px_rgba(34,197,94,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:from-[#18b352] hover:to-[#37d977] hover:shadow-[0_14px_38px_rgba(34,197,94,0.42)]"
                    >
                      Acessar Módulo
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                    </button>
                  ) : (
                    <div className="mt-6 flex h-12 w-full items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-sm font-medium text-amber-300">
                      Em breve
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Aviso de módulos em desenvolvimento */}
          {temModuloBloqueado && (
            <div className="mx-auto mt-8 flex max-w-5xl items-start gap-4 rounded-2xl border border-amber-400/15 bg-amber-400/[0.06] p-5 backdrop-blur-sm animate-fade-in-up">
              <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div>
                <h4 className="font-semibold text-white">Novos módulos em desenvolvimento</h4>
                <p className="mt-1 text-sm text-white/55">
                  O módulo de Indicadores RH está sendo desenvolvido e estará disponível em breve.
                  Os módulos de Premiações e Cargos e Salários já estão completos e prontos para uso.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Rodapé */}
        <footer className="relative z-10 pb-6 text-center">
          <p className="text-xs text-white/45">© {new Date().getFullYear()} Concrem</p>
        </footer>
      </div>
    </div>
  );
}
