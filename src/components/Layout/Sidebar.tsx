import { useState } from "react";
import logoImage from "@/assets/logo-concrem-new.png";
import logoCollapsed from "@/assets/logo-concrem-collapsed-new.png";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "./MainLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Shield,
  HardHat,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  PieChart,
  Settings,
  ChevronDown,
  ChevronRight,
  Building2,
  Layers,
  UserCog,
  Tag,
  Target,
  Factory,
  BarChart4,
  Gift,
  UserCheck,
  HardHatIcon,
  TrendingUpIcon,
  Home,
  LogOut,
  FileBarChart2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  {
    title: "DASHBOARD",
    href: "/premiacoes",
    icon: LayoutDashboard,
  },
];

const rhItems = [
  {
    title: "Funcionários",
    href: "/premiacoes/funcionarios",
    icon: Users,
  },
  {
    title: "Faltas/Advertências",
    href: "/premiacoes/faltas-advertencias",
    icon: AlertTriangle,
  },
];

const sesmtItems = [
  {
    title: "DSS",
    href: "/premiacoes/dss",
    icon: Shield,
  },
  {
    title: "EPI",
    href: "/premiacoes/epi",
    icon: HardHat,
  },
];

const producaoItems = [
  {
    title: "Produção por Setor",
    href: "/premiacoes/producao-setor",
    icon: BarChart3,
  },
  {
    title: "Indicadores por Setor",
    href: "/premiacoes/indicadores-setor",
    icon: TrendingUp,
  },
  {
    title: "Indicadores Gerais",
    href: "/premiacoes/indicadores-gerais",
    icon: PieChart,
  },
];

const premiacoesItems = [
  {
    title: "Gerar Premiações",
    href: "/premiacoes/gerar-premiacoes",
    icon: Gift,
  },
  {
    title: "Relatório de Premiações",
    href: "/premiacoes/relatorio-premiacoes",
    icon: FileBarChart2,
  },
];

const cadastrosItems = [
  {
    title: "Setores",
    href: "/premiacoes/cadastros/setores",
    icon: Building2,
  },
  {
    title: "Faixas",
    href: "/premiacoes/cadastros/faixas",
    icon: Layers,
  },
  {
    title: "Funções",
    href: "/premiacoes/cadastros/funcoes",
    icon: UserCog,
  },
  {
    title: "Categorias",
    href: "/premiacoes/cadastros/categorias",
    icon: Tag,
  },
  {
    title: "Base Premiação",
    href: "/premiacoes/cadastros/base-premiacao",
    icon: Target,
  },
  {
    title: "Empresas",
    href: "/premiacoes/cadastros/empresas",
    icon: Factory,
  },
  {
    title: "Tipos de Indicadores",
    href: "/premiacoes/cadastros/tipos-indicadores",
    icon: BarChart4,
  },
  {
    title: "Tipos Indicadores Gerais",
    href: "/premiacoes/cadastros/tipos-indicadores-gerais",
    icon: PieChart,
  },
  {
    title: "Locais DSS",
    href: "/premiacoes/cadastros/locais-dss",
    icon: Shield,
  },
  {
    title: "Fórmulas de Cálculo",
    href: "/premiacoes/cadastros/formulas-calculo",
    icon: Settings,
  },
  {
    title: "Configurações Kits",
    href: "/premiacoes/cadastros/configuracoes-kits",
    icon: TrendingUpIcon,
  },
];

export const Sidebar = () => {
  const [rhOpen, setRhOpen] = useState(false);
  const [sesmtOpen, setSesmtOpen] = useState(false);
  const [producaoOpen, setProducaoOpen] = useState(false);
  const [premiacoesOpen, setPremiacoesOpen] = useState(false);
  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { canAccess, signOut, profile } = useAuth();
  const isAdmin = profile?.perfil === 'admin';
  const isUsuariosActive = location.pathname === '/cadastros/usuarios';

  const showDashboard = canAccess('dashboard');
  const showRH = canAccess('rh');
  const showSESMT = canAccess('sesmt');
  const showProducao = canAccess('producao');
  const showPremiacoes = canAccess('premiacoes');
  const showCadastros = canAccess('cadastros');

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/login");
      toast({ title: "Logout realizado com sucesso" });
    } catch (error) {
      toast({ title: "Erro ao fazer logout", variant: "destructive" });
    }
  };

  const isActive = (href: string) => {
    if (href === "/premiacoes") {
      return location.pathname === "/premiacoes";
    }
    return location.pathname.startsWith(href);
  };

  const isRhActive = rhItems.some(item => isActive(item.href));
  const isSesmtActive = sesmtItems.some(item => isActive(item.href));
  const isProducaoActive = producaoItems.some(item => isActive(item.href));
  const isPremiacoesActive = premiacoesItems.some(item => isActive(item.href));
  const isCadastrosActive = cadastrosItems.some(item => isActive(item.href));

  return (
    <div className={cn(
      "bg-primary min-h-screen fixed left-0 top-0 z-40 flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Logo/Header */}
      <div className="p-6 border-b border-primary-hover flex justify-center">
        <img 
          src={isCollapsed ? logoCollapsed : logoImage} 
          alt="Concrem Logo" 
          className={cn(
            "object-contain cursor-pointer transition-all duration-300",
            isCollapsed ? "h-14 w-14" : "h-11 w-auto"
          )}
          onClick={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {showDashboard && menuItems.map((item) => (
          <Link key={item.href} to={item.href}>
            <Button
              variant="sidebar"
              className={cn(
                "gap-3 text-left",
                isActive(item.href) && "bg-primary-hover",
                isCollapsed && "justify-center px-0"
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <item.icon className="h-5 w-5" />
              {!isCollapsed && item.title}
            </Button>
          </Link>
        ))}

        {/* RH submenu */}
        {showRH && !isCollapsed && (
          <div>
            <Button
              variant="sidebar"
              className={cn(
                "gap-3 text-left",
                (isRhActive || rhOpen) && "bg-primary-hover"
              )}
              onClick={() => setRhOpen(!rhOpen)}
            >
              <UserCheck className="h-5 w-5" />
              RH
              {rhOpen ? (
                <ChevronDown className="h-4 w-4 ml-auto" />
              ) : (
                <ChevronRight className="h-4 w-4 ml-auto" />
              )}
            </Button>

            {rhOpen && (
              <div className="ml-4 mt-2 space-y-1">
                {rhItems.map((item) => (
                  <Link key={item.href} to={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 text-primary-foreground hover:bg-primary-hover",
                        isActive(item.href) && "bg-primary-hover"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* RH collapsed - show individual items */}
        {showRH && isCollapsed && rhItems.map((item) => (
          <Link key={item.href} to={item.href}>
            <Button
              variant="sidebar"
              className={cn(
                "justify-center px-0",
                isActive(item.href) && "bg-primary-hover"
              )}
              title={item.title}
            >
              <item.icon className="h-5 w-5" />
            </Button>
          </Link>
        ))}

        {/* SESMT submenu */}
        {showSESMT && !isCollapsed && (
          <div>
            <Button
              variant="sidebar"
              className={cn(
                "gap-3 text-left",
                (isSesmtActive || sesmtOpen) && "bg-primary-hover"
              )}
              onClick={() => setSesmtOpen(!sesmtOpen)}
            >
              <Shield className="h-5 w-5" />
              SESMT
              {sesmtOpen ? (
                <ChevronDown className="h-4 w-4 ml-auto" />
              ) : (
                <ChevronRight className="h-4 w-4 ml-auto" />
              )}
            </Button>

            {sesmtOpen && (
              <div className="ml-4 mt-2 space-y-1">
                {sesmtItems.map((item) => (
                  <Link key={item.href} to={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 text-primary-foreground hover:bg-primary-hover",
                        isActive(item.href) && "bg-primary-hover"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* SESMT collapsed - show individual items */}
        {showSESMT && isCollapsed && sesmtItems.map((item) => (
          <Link key={item.href} to={item.href}>
            <Button
              variant="sidebar"
              className={cn(
                "justify-center px-0",
                isActive(item.href) && "bg-primary-hover"
              )}
              title={item.title}
            >
              <item.icon className="h-5 w-5" />
            </Button>
          </Link>
        ))}

        {/* PRODUÇÃO submenu */}
        {showProducao && !isCollapsed && (
          <div>
            <Button
              variant="sidebar"
              className={cn(
                "gap-3 text-left",
                (isProducaoActive || producaoOpen) && "bg-primary-hover"
              )}
              onClick={() => setProducaoOpen(!producaoOpen)}
            >
              <Factory className="h-5 w-5" />
              PRODUÇÃO
              {producaoOpen ? (
                <ChevronDown className="h-4 w-4 ml-auto" />
              ) : (
                <ChevronRight className="h-4 w-4 ml-auto" />
              )}
            </Button>

            {producaoOpen && (
              <div className="ml-4 mt-2 space-y-1">
                {producaoItems.map((item) => (
                  <Link key={item.href} to={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 text-primary-foreground hover:bg-primary-hover",
                        isActive(item.href) && "bg-primary-hover"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* PRODUÇÃO collapsed - show individual items */}
        {showProducao && isCollapsed && producaoItems.map((item) => (
          <Link key={item.href} to={item.href}>
            <Button
              variant="sidebar"
              className={cn(
                "justify-center px-0",
                isActive(item.href) && "bg-primary-hover"
              )}
              title={item.title}
            >
              <item.icon className="h-5 w-5" />
            </Button>
          </Link>
        ))}

        {/* PREMIAÇÕES submenu */}
        {showPremiacoes && !isCollapsed && (
          <div>
            <Button
              variant="sidebar"
              className={cn(
                "gap-3 text-left",
                (isPremiacoesActive || premiacoesOpen) && "bg-primary-hover"
              )}
              onClick={() => setPremiacoesOpen(!premiacoesOpen)}
            >
              <Gift className="h-5 w-5" />
              PREMIAÇÕES
              {premiacoesOpen ? (
                <ChevronDown className="h-4 w-4 ml-auto" />
              ) : (
                <ChevronRight className="h-4 w-4 ml-auto" />
              )}
            </Button>

            {premiacoesOpen && (
              <div className="ml-4 mt-2 space-y-1">
                {premiacoesItems.map((item) => (
                  <Link key={item.href} to={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 text-primary-foreground hover:bg-primary-hover",
                        isActive(item.href) && "bg-primary-hover"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* PREMIAÇÕES collapsed - show individual items */}
        {showPremiacoes && isCollapsed && premiacoesItems.map((item) => (
          <Link key={item.href} to={item.href}>
            <Button
              variant="sidebar"
              className={cn(
                "justify-center px-0",
                isActive(item.href) && "bg-primary-hover"
              )}
              title={item.title}
            >
              <item.icon className="h-5 w-5" />
            </Button>
          </Link>
        ))}

        {/* Cadastros submenu */}
        {showCadastros && !isCollapsed && (
          <div>
            <Button
              variant="sidebar"
              className={cn(
                "gap-3 text-left",
                (isCadastrosActive || cadastrosOpen) && "bg-primary-hover"
              )}
              onClick={() => setCadastrosOpen(!cadastrosOpen)}
            >
              <Settings className="h-5 w-5" />
              CADASTROS
              {cadastrosOpen ? (
                <ChevronDown className="h-4 w-4 ml-auto" />
              ) : (
                <ChevronRight className="h-4 w-4 ml-auto" />
              )}
            </Button>

            {cadastrosOpen && (
              <div className="ml-4 mt-2 space-y-1">
                {cadastrosItems.map((item) => (
                  <Link key={item.href} to={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        "w-full justify-start gap-3 text-primary-foreground hover:bg-primary-hover",
                        isActive(item.href) && "bg-primary-hover"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </Button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Usuários - apenas admin */}
        {isAdmin && !isCollapsed && (
          <Link to="/cadastros/usuarios">
            <Button
              variant="sidebar"
              className={cn("gap-3 text-left", isUsuariosActive && "bg-primary-hover")}
            >
              <Users className="h-5 w-5" />
              USUÁRIOS
            </Button>
          </Link>
        )}
        {isAdmin && isCollapsed && (
          <Link to="/cadastros/usuarios">
            <Button
              variant="sidebar"
              className={cn("justify-center px-0", isUsuariosActive && "bg-primary-hover")}
              title="Usuários"
            >
              <Users className="h-5 w-5" />
            </Button>
          </Link>
        )}

        {/* Cadastros collapsed - show individual items */}
        {showCadastros && isCollapsed && cadastrosItems.map((item) => (
          <Link key={item.href} to={item.href}>
            <Button
              variant="sidebar"
              className={cn(
                "justify-center px-0",
                isActive(item.href) && "bg-primary-hover"
              )}
              title={item.title}
            >
              <item.icon className="h-5 w-5" />
            </Button>
          </Link>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-4 border-t border-primary-hover space-y-2">
        {showDashboard && (
          <Link to="/">
            <Button
              variant="sidebar"
              className={cn(
                "gap-3 text-left",
                isCollapsed && "justify-center px-0"
              )}
              title={isCollapsed ? "Voltar ao Hub" : undefined}
            >
              <Home className="h-5 w-5" />
              {!isCollapsed && "Voltar ao Hub"}
            </Button>
          </Link>
        )}

        <Button
          variant="sidebar"
          className={cn(
            "gap-3 text-left",
            isCollapsed && "justify-center px-0"
          )}
          onClick={handleLogout}
          title={isCollapsed ? "Sair" : undefined}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && "Sair"}
        </Button>
      </div>
    </div>
  );
};