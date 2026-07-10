import { Users, TrendingUp, AlertTriangle, BarChart3, LayoutDashboard } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { MetricCard } from "@/components/app/MetricCard";
import { SectionCard } from "@/components/app/SectionCard";
import { StatusBadge, type StatusVariant } from "@/components/app/StatusBadge";

export const Dashboard = () => {
  // Dados de exemplo para o dashboard
  const stats = [
    { title: "Total de Funcionários", value: "127", description: "93 ativos, 34 inativos", icon: Users, trend: "+3 este mês" },
    { title: "Meta de Produção", value: "87%", description: "Meta atingida este mês", icon: TrendingUp, trend: "+12% vs mês anterior" },
    { title: "Participação DSS", value: "94%", description: "Média de presença", icon: BarChart3, trend: "+2% vs mês anterior" },
    { title: "Não conformidades EPI", value: "8", description: "Pendências para resolução", icon: AlertTriangle, trend: "-3 vs semana anterior" },
  ];

  const recentActivities: { action: string; description: string; time: string; status: StatusVariant; label: string }[] = [
    { action: "Funcionário cadastrado", description: "João Silva - Setor Produção", time: "2 horas atrás", status: "success", label: "Concluído" },
    { action: "DSS realizado", description: "Tema: Uso correto de EPIs", time: "1 dia atrás", status: "success", label: "Concluído" },
    { action: "Não conformidade EPI", description: "Maria Santos - Capacete danificado", time: "2 dias atrás", status: "warning", label: "Atenção" },
    { action: "Meta de produção atingida", description: "Setor Montagem - 105% da meta", time: "3 dias atrás", status: "success", label: "Concluído" },
  ];

  const setores = [
    { setor: "Produção", funcionarios: 45, meta: 98 },
    { setor: "Montagem", funcionarios: 32, meta: 105 },
    { setor: "Qualidade", funcionarios: 18, meta: 92 },
    { setor: "Expedição", funcionarios: 22, meta: 87 },
  ];

  const metaTone = (m: number) =>
    m >= 100 ? "bg-success" : m >= 90 ? "bg-primary" : "bg-status-warning";

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        title="Dashboard"
        description="Visão geral do módulo de Premiações"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <MetricCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
            trend={stat.trend}
          />
        ))}
      </div>

      {/* Conteúdo */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard title="Atividades Recentes" description="Últimas movimentações no sistema">
          <div className="space-y-2">
            {recentActivities.map((activity, index) => (
              <div
                key={index}
                className="flex items-start justify-between gap-3 rounded-lg border border-transparent p-3 transition-colors hover:border-border/60 hover:bg-muted/50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{activity.action}</p>
                  <p className="truncate text-sm text-muted-foreground">{activity.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{activity.time}</p>
                </div>
                <StatusBadge variant={activity.status}>{activity.label}</StatusBadge>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Resumo por Setor" description="Performance dos setores no mês atual">
          <div className="space-y-4">
            {setores.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.setor}</p>
                    <p className="text-xs text-muted-foreground">{item.funcionarios} funcionários</p>
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {item.meta}
                    <span className="text-sm font-medium text-muted-foreground">%</span>
                  </p>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${metaTone(item.meta)}`}
                    style={{ width: `${Math.min(item.meta, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
};
