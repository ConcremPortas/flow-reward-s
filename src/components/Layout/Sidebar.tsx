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
  Factory
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Funcionários",
    href: "/funcionarios",
    icon: Users,
  },
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
  {
    title: "Faltas/Advertências",
    href: "/faltas-advertencias",
    icon: AlertTriangle,
  },
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
];

export const Sidebar = () => {
  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(href);
  };

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
            isCollapsed ? "h-10 w-10" : "h-8 w-auto"
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