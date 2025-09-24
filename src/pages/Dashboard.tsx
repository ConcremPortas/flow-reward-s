import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Users, TrendingUp, AlertTriangle, BarChart3 } from "lucide-react";

export const Dashboard = () => {
  // Dados de exemplo para o dashboard
  const stats = [
    {
      title: "Total de Funcionários",
      value: "127",
      description: "93 ativos, 34 inativos",
      icon: Users,
      trend: "+3 este mês"
    },
    {
      title: "Meta de Produção",
      value: "87%",
      description: "Meta atingida este mês",
      icon: TrendingUp,
      trend: "+12% vs mês anterior"
    },
    {
      title: "Participação DSS",
      value: "94%",
      description: "Média de presença",
      icon: BarChart3,
      trend: "+2% vs mês anterior"
    },
    {
      title: "Não conformidades EPI",
      value: "8",
      description: "Pendências para resolução",
      icon: AlertTriangle,
      trend: "-3 vs semana anterior"
    }
  ];

  const recentActivities = [
    {
      action: "Funcionário cadastrado",
      description: "João Silva - Setor Produção",
      time: "2 horas atrás",
      status: "active" as const
    },
    {
      action: "DSS realizado",
      description: "Tema: Uso correto de EPIs",
      time: "1 dia atrás", 
      status: "active" as const
    },
    {
      action: "Não conformidade EPI",
      description: "Maria Santos - Capacete danificado",
      time: "2 dias atrás",
      status: "warning" as const
    },
    {
      action: "Meta de produção atingida",
      description: "Setor Montagem - 105% da meta",
      time: "3 dias atrás",
      status: "active" as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="card-elegant card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
              <p className="text-xs text-success mt-1">
                {stat.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Atividades Recentes */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle>Atividades Recentes</CardTitle>
            <CardDescription>
              Últimas movimentações no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-accent/50 hover:bg-accent transition-colors">
                  <StatusBadge status={activity.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Resumo por Setor */}
        <Card className="card-elegant">
          <CardHeader>
            <CardTitle>Resumo por Setor</CardTitle>
            <CardDescription>
              Performance dos setores no mês atual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { setor: "Produção", funcionarios: 45, meta: 98 },
                { setor: "Montagem", funcionarios: 32, meta: 105 },
                { setor: "Qualidade", funcionarios: 18, meta: 92 },
                { setor: "Expedição", funcionarios: 22, meta: 87 }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-accent/50">
                  <div>
                    <p className="font-medium text-foreground">{item.setor}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.funcionarios} funcionários
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">{item.meta}%</p>
                    <p className="text-xs text-muted-foreground">Meta mensal</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};