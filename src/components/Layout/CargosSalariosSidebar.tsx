import { useState } from "react";
import logoImage from "@/assets/logo-concrem-new.png";
import logoCollapsed from "@/assets/logo-concrem-collapsed-new.png";
import { Link, useLocation } from "react-router-dom";
import { useSidebar } from "./MainLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  Building2,
  Home,
  LogOut,
  ChevronDown,
  ChevronRight,
  Settings
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const menuItems = [
  {
    title: "DASHBOARD",
    href: "/cargos-salarios",
    icon: LayoutDashboard,
  },
  {
    title: "Cargos",
    href: "/cargos-salarios/cargos",
    icon: Briefcase,
  },
  {
    title: "Funcionários",
    href: "/cargos-salarios/funcionarios",
    icon: Users,
  },
];

const cadastrosItems = [
  {
    title: "Setores",
    href: "/cargos-salarios/cadastros/setores",
    icon: Building2,
  },
];

export const CargosSalariosSidebar = () => {
  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signOut } = useAuth();

  const handleLogout = () => {
    signOut();
    navigate("/login");
    toast({ title: "Logout realizado com sucesso" });
  };

  const handleBackToHub = () => {
    navigate("/");
  };

  const isActive = (href: string) => {
    if (href === "/cargos-salarios") {
      return location.pathname === "/cargos-salarios";
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

      {/* Footer */}
      <div className="p-4 border-t border-primary-hover space-y-2">
        <Button
          variant="sidebar"
          className={cn(
            "gap-3",
            isCollapsed && "justify-center px-0"
          )}
          onClick={handleBackToHub}
          title={isCollapsed ? "Voltar ao Hub" : undefined}
        >
          <Home className="h-5 w-5" />
          {!isCollapsed && "Voltar ao Hub"}
        </Button>
        
        <Button
          variant="sidebar"
          className={cn(
            "gap-3",
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
