import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const getPageTitle = (pathname: string) => {
  const routes: Record<string, string> = {
    "/premiacoes": "Dashboard",
    "/premiacoes/funcionarios": "Funcionários",
    "/premiacoes/dss": "DSS - Diálogo Semanal de Segurança",
    "/premiacoes/epi": "EPI - Equipamento de Proteção Individual",
    "/premiacoes/faltas-advertencias": "Faltas e Advertências",
    "/premiacoes/producao-setor": "Produção por Setor",
    "/premiacoes/indicadores-setor": "Indicadores por Setor",
    "/premiacoes/indicadores-gerais": "Indicadores Gerais",
    "/premiacoes/cadastros/setores": "Cadastro de Setores",
    "/premiacoes/cadastros/faixas": "Cadastro de Faixas",
    "/premiacoes/cadastros/funcoes": "Cadastro de Funções",
    "/premiacoes/cadastros/categorias": "Cadastro de Categorias",
    "/premiacoes/cadastros/base-premiacao": "Cadastro de Base Premiação",
    "/premiacoes/cadastros/empresas": "Cadastro de Empresas",
    "/premiacoes/cadastros/tipos-indicadores": "Cadastro de Tipos de Indicadores",
    "/premiacoes/cadastros/tipos-indicadores-gerais": "Cadastro de Tipos Indicadores Gerais",
    "/premiacoes/cadastros/locais-dss": "Cadastro de Locais DSS",
    "/premiacoes/cadastros/formulas-calculo": "Cadastro de Fórmulas de Cálculo",
    "/premiacoes/gerar-premiacoes": "Gerar Premiações",
  };

  return routes[pathname] || "Página";
};

const getBreadcrumbs = (pathname: string) => {
  const breadcrumbs = [{ label: "Premiações", href: "/premiacoes" }];

  if (pathname === "/premiacoes") return breadcrumbs;

  if (pathname.startsWith("/premiacoes/cadastros/")) {
    breadcrumbs.push({ label: "Cadastros", href: "/premiacoes/cadastros" });
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
  const navigate = useNavigate();
  const pageTitle = getPageTitle(location.pathname);
  const breadcrumbs = getBreadcrumbs(location.pathname);
  const showHubButton = location.pathname.startsWith("/premiacoes");

  return (
    <header className="bg-card border-b border-border p-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-2 flex-1">
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

        {/* Hub Button */}
        {showHubButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/")}
            className="ml-4"
          >
            <Home className="h-4 w-4 mr-2" />
            Voltar ao Hub RH
          </Button>
        )}
      </div>
    </header>
  );
};