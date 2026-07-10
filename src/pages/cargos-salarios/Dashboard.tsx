import { Briefcase, Users, DollarSign, TrendingUp, Building2, Award } from 'lucide-react';
import { PageHeader } from '@/components/app/PageHeader';
import { MetricCard } from '@/components/app/MetricCard';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge } from '@/components/app/StatusBadge';
import { useCargos } from '@/hooks/useCargos';
import { useSetores } from '@/hooks/useSetores';
import { useFuncionariosSensivel } from '@/hooks/useFuncionariosSensivel';

export default function CargosSalariosDashboard() {
  const { cargos } = useCargos();
  const { setores } = useSetores();
  // Media salarial precisa de salario -> view guardada (Fase 5B). Traz tambem
  // ativo/funcao_id, suficientes para os contadores deste dashboard.
  const { dados: funcionarios } = useFuncionariosSensivel();

  const funcionariosAtivos = funcionarios.filter(f => f.ativo);

  const mediaSalarial = funcionariosAtivos.length > 0
    ? funcionariosAtivos.reduce((acc, f) => acc + (f.salario || 0), 0) / funcionariosAtivos.length
    : 0;

  const funcionariosPorCargo = funcionariosAtivos.reduce((acc, f) => {
    const cargo = f.funcao_id || 'sem_cargo';
    acc[cargo] = (acc[cargo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const taxaPreenchimento = cargos.length > 0
    ? Math.round((Object.keys(funcionariosPorCargo).length / cargos.length) * 100)
    : 0;

  const niveisHierarquicos = new Set(cargos.map(c => c.nivel_hierarquico).filter(Boolean)).size;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        icon={Briefcase}
        title="Cargos e Salários"
        description="Visão geral da estrutura de cargos e salários"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Total de Cargos"
          value={cargos.length}
          description="Cargos ativos cadastrados"
          icon={Briefcase}
        />
        <MetricCard
          title="Colaboradores"
          value={funcionariosAtivos.length}
          description="Funcionários ativos"
          icon={Users}
        />
        <MetricCard
          title="Média Salarial"
          value={formatCurrency(mediaSalarial)}
          description="Média geral da empresa"
          icon={DollarSign}
        />
        <MetricCard
          title="Setores"
          value={setores.length}
          description="Setores cadastrados"
          icon={Building2}
        />
        <MetricCard
          title="Níveis Hierárquicos"
          value={niveisHierarquicos}
          description="Níveis diferentes"
          icon={TrendingUp}
        />
        <MetricCard
          title="Taxa de Preenchimento"
          value={`${taxaPreenchimento}%`}
          description="Cargos com colaboradores"
          icon={Award}
        />
      </div>

      {/* Cargos Recentes */}
      <SectionCard
        title="Cargos Cadastrados Recentemente"
        description="Últimos cargos adicionados à estrutura"
      >
        {cargos.length === 0 ? (
          <div className="py-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">
              <Briefcase className="h-6 w-6" />
            </div>
            <p className="text-sm text-muted-foreground">Nenhum cargo cadastrado ainda</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {cargos.slice(0, 5).map((cargo) => {
              const funcionariosNoCargo = funcionariosAtivos.filter(
                f => f.funcao_id === cargo.id
              ).length;

              return (
                <div
                  key={cargo.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-card p-3.5 transition-colors hover:border-primary/25 hover:bg-muted/40"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">{cargo.nome}</h4>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {cargo.concremrh_setores?.nome || 'Setor não definido'}
                      </span>
                      <StatusBadge variant={funcionariosNoCargo > 0 ? 'info' : 'neutral'}>
                        {funcionariosNoCargo} colaborador(es)
                      </StatusBadge>
                    </div>
                  </div>
                  {(cargo.salario_minimo || cargo.salario_maximo) && (
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {formatCurrency(cargo.salario_minimo || 0)} - {formatCurrency(cargo.salario_maximo || 0)}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
