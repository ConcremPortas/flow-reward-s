import { useState } from "react";
import logoImage from "@/assets/logo-concrem-new.png";
import logoCollapsed from "@/assets/logo-concrem-collapsed-new.png";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "./MainLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  TrendingUpIcon
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
];

const rhItems = [
  {
    title: "Funcionários",
    href: "/funcionarios",
    icon: Users,
  },
  {
    title: "Faltas/Advertências",
    href: "/faltas-advertencias",
    icon: AlertTriangle,
  },
];

const sesmtItems = [
  {
    title: "DSS",
    href: "/dss",
    icon: Shield,
  },
  {
    title: "EPI",
    href: "/epi",
    icon: HardHat,
  },
];

const producaoItems = [
  {
    title: "Produção por Setor",
    href: "/producao-setor",
    icon: BarChart3,
  },
  {
    title: "Indicadores por Setor",
    href: "/indicadores-setor",
    icon: TrendingUp,
  },
  {
    title: "Indicadores Gerais",
    href: "/indicadores-gerais",
    icon: PieChart,
  },
];

const premiacoesItems = [
  {
    title: "Gerar Premiações",
    href: "/gerar-premiacoes",
    icon: Gift,
  },
];

const cadastrosItems = [
  {
    title: "Setores",
    href: "/cadastros/setores",
    icon: Building2,
  },
  {
    title: "Faixas",
    href: "/cadastros/faixas",
    icon: Layers,
  },
  {
    title: "Funções",
    href: "/cadastros/funcoes",
    icon: UserCog,
  },
  {
    title: "Categorias",
    href: "/cadastros/categorias",
    icon: Tag,
  },
  {
    title: "Base Premiação",
    href: "/cadastros/base-premiacao",
    icon: Target,
  },
  {
    title: "Empresas",
    href: "/cadastros/empresas",
    icon: Factory,
  },
  {
    title: "Tipos de Indicadores",
    href: "/cadastros/tipos-indicadores",
    icon: BarChart4,
  },
  {
    title: "Tipos Indicadores Gerais",
    href: "/cadastros/tipos-indicadores-gerais",
    icon: PieChart,
  },
  {
    title: "Locais DSS",
    href: "/cadastros/locais-dss",
    icon: Shield,
  },
  {
    title: "Fórmulas de Cálculo",
    href: "/cadastros/formulas-calculo",
    icon: Settings,
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

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
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
        {menuItems.map((item) => (
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
        {!isCollapsed && (
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
        {isCollapsed && rhItems.map((item) => (
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
        {!isCollapsed && (
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
        {isCollapsed && sesmtItems.map((item) => (
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
        {!isCollapsed && (
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
        {isCollapsed && producaoItems.map((item) => (
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
        {!isCollapsed && (
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
        {isCollapsed && premiacoesItems.map((item) => (
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
        {!isCollapsed && (
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
              Cadastros
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
        
        {/* Cadastros collapsed - show individual items */}
        {isCollapsed && cadastrosItems.map((item) => (
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
    </div>
  );
};