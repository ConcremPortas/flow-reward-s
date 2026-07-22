import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { useDashboardData } from "@/features/dashboard/hooks/useDashboardData";
import { normalizeView, type ViewKey } from "@/features/dashboard/views";

import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { AnalyticsNavigation } from "@/components/dashboard/AnalyticsNavigation";
import { AnalyticsFilterBar } from "@/components/dashboard/AnalyticsFilterBar";
import { AnalyticsFooterNavigation } from "@/components/dashboard/AnalyticsFooterNavigation";
import { ViewModeToggle } from "@/components/dashboard/ViewModeToggle";
import { AttentionCenter } from "@/components/dashboard/AttentionCenter";
import { AnalyticsDrawer, type DrawerData } from "@/components/dashboard/AnalyticsDrawer";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { DashboardEmptyState } from "@/components/dashboard/DashboardEmptyState";

import { ExecutiveOverviewPage } from "@/components/dashboard/pages/ExecutiveOverviewPage";
import { PeopleMovementPage } from "@/components/dashboard/pages/PeopleMovementPage";
import { HealthSafetyPage } from "@/components/dashboard/pages/HealthSafetyPage";
import { SectorPerformancePage } from "@/components/dashboard/pages/SectorPerformancePage";
import { RewardsImpactPage } from "@/components/dashboard/pages/RewardsImpactPage";
import type { PageProps } from "@/components/dashboard/pages/_shared";

/**
 * Central Analítica de RH — experiência paginada (5 visões).
 * Container único: carrega os dados uma vez, mantém filtros e controla a página
 * via query string (?view=...). As páginas recebem o modelo já processado.
 */
export const Dashboard = () => {
  const dash = useDashboardData();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = normalizeView(searchParams.get("view"));

  const [drawer, setDrawer] = useState<DrawerData | null>(null);
  const [showAllAttention, setShowAllAttention] = useState(false);

  const setView = (v: ViewKey) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("view", v);
    setSearchParams(sp);
  };

  if (dash.loading && !dash.lastUpdated) return <DashboardSkeleton />;

  const pageProps: PageProps = {
    dash,
    openDrawer: setDrawer,
    onSeeAllAttention: () => setShowAllAttention(true),
  };

  const renderPage = () => {
    switch (view) {
      case "pessoas": return <PeopleMovementPage {...pageProps} />;
      case "saude": return <HealthSafetyPage {...pageProps} />;
      case "setores": return <SectorPerformancePage {...pageProps} />;
      case "premiacao": return <RewardsImpactPage {...pageProps} />;
      default: return <ExecutiveOverviewPage {...pageProps} />;
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-[18px]">
      <DashboardHeader
        competencia={dash.filters.competencia}
        lastUpdated={dash.lastUpdated}
        actions={
          <>
            <ViewModeToggle value={dash.viewMode} onChange={dash.setViewMode} />
            <Button variant="outline" size="sm" className="h-8" onClick={dash.refetch} disabled={dash.loading}>
              <RefreshCw className={`mr-1.5 h-4 w-4 ${dash.loading ? "animate-spin" : ""}`} /> Atualizar
            </Button>
            <Button variant="outline" size="sm" className="h-8" disabled title="Exportação do painel em breve">
              <Download className="mr-1.5 h-4 w-4" /> Exportar
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <AnalyticsNavigation active={view} onChange={setView} />
          <AnalyticsFilterBar
            filters={dash.filters}
            options={dash.options}
            onChange={dash.setFilters}
            onReset={dash.resetFilters}
          />
        </div>
      </DashboardHeader>

      {!dash.hasData ? (
        <DashboardEmptyState onRetry={dash.refetch} />
      ) : (
        <>
          <div key={view} className="animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none">
            {renderPage()}
          </div>
          <AnalyticsFooterNavigation active={view} onChange={setView} />
        </>
      )}

      <AnalyticsDrawer data={drawer} onClose={() => setDrawer(null)} />

      <Sheet open={showAllAttention} onOpenChange={setShowAllAttention}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Central de Atenção — todas as situações</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <AttentionCenter items={dash.attention} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};
