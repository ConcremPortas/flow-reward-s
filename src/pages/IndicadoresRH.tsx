import { useNavigate } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { BarChart3, LineChart, Building2, Factory, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { SectionCard } from "@/components/app/SectionCard";

interface ModuloIndicador {
  title: string;
  description: string;
  icon: LucideIcon;
  route: string;
}

const MODULOS: ModuloIndicador[] = [
  {
    title: "Indicadores Gerais",
    description: "Metas e realizações dos indicadores gerais da empresa por competência.",
    icon: LineChart,
    route: "/premiacoes/indicadores-gerais",
  },
  {
    title: "Indicadores por Setor",
    description: "Acompanhamento dos indicadores operacionais apurados por setor.",
    icon: Building2,
    route: "/premiacoes/indicadores-setor",
  },
  {
    title: "Produção por Setor",
    description: "Metas e produção realizada por setor e período.",
    icon: Factory,
    route: "/premiacoes/producao-setor",
  },
];

export function IndicadoresRH() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Indicadores RH"
        description="Análise e acompanhamento dos indicadores de RH"
      />

      <SectionCard
        title="Módulos de Indicadores"
        description="Selecione um painel para visualizar e registrar os dados"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {MODULOS.map((modulo) => {
            const Icon = modulo.icon;
            return (
              <button
                key={modulo.route}
                type="button"
                onClick={() => navigate(modulo.route)}
                className="group flex flex-col rounded-xl border border-border/70 bg-card p-6 text-left shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--shadow-hover)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/[0.08] text-primary transition-colors group-hover:bg-primary/[0.14]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{modulo.title}</h3>
                <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {modulo.description}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  Acessar painel
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}

export default IndicadoresRH;
