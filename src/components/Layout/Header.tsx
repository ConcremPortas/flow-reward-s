import { useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";

const getPageTitle = (pathname: string) => {
  const routes: Record<string, string> = {
    "/": "Dashboard",
    "/funcionarios": "Funcionários",
    "/dss": "DSS - Diálogo Semanal de Segurança",
    "/epi": "EPI - Equipamento de Proteção Individual",
    "/faltas-advertencias": "Faltas e Advertências",
    "/producao-setor": "Produção por Setor",
    "/indicadores-setor": "Indicadores por Setor",
    "/indicadores-gerais": "Indicadores Gerais",
    "/cadastros/setores": "Cadastro de Setores",
    "/cadastros/faixas": "Cadastro de Faixas",
    "/cadastros/funcoes": "Cadastro de Funções",
    "/cadastros/categorias": "Cadastro de Categorias",
    "/cadastros/base-premiacao": "Cadastro de Base Premiação",
    "/cadastros/empresas": "Cadastro de Empresas",
  };

  return routes[pathname] || "Página";
};

const getBreadcrumbs = (pathname: string) => {
  const breadcrumbs = [{ label: "Início", href: "/" }];

  if (pathname === "/") return breadcrumbs;

  if (pathname.startsWith("/cadastros/")) {
    breadcrumbs.push({ label: "Cadastros", href: "/cadastros" });
    const pageTitle = getPageTitle(pathname);
    breadcrumbs.push({ label: pageTitle, href: pathname });
  } else {
    const pageTitle = getPageTitle(pathname);
    breadcrumbs.push({ label: pageTitle, href: pathname });
  }

  return breadcrumbs;
};

export const Header = () => {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);
  const breadcrumbs = getBreadcrumbs(location.pathname);

  return (
    <header className="bg-card border-b border-border p-6">
      <div className="flex flex-col space-y-2">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center">
              {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? "text-foreground font-medium"
                    : "hover:text-foreground cursor-pointer"
                }
              >
                {crumb.label}
              </span>
            </div>
          ))}
        </nav>

        {/* Page Title */}
        <h1 className="text-2xl font-bold text-foreground">{pageTitle}</h1>
      </div>
    </header>
  );
};