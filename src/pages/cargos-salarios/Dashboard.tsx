import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Users, DollarSign, TrendingUp, Building2, Award } from 'lucide-react';
import { useCargos } from '@/hooks/useCargos';
import { useSetores } from '@/hooks/useSetores';
import { useFuncionarios } from '@/hooks/useFuncionarios';

export default function CargosSalariosDashboard() {
  const { cargos } = useCargos();
  const { setores } = useSetores();
  const { funcionarios } = useFuncionarios();

  const funcionariosAtivos = funcionarios.filter(f => f.ativo);
  
  const mediaSalarial = funcionariosAtivos.length > 0
    ? funcionariosAtivos.reduce((acc, f) => acc + (f.salario || 0), 0) / funcionariosAtivos.length
    : 0;

  const funcionariosPorCargo = funcionariosAtivos.reduce((acc, f) => {
    const cargo = f.funcao_id || 'sem_cargo';
    acc[cargo] = (acc[cargo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
          <Briefcase className="h-8 w-8 text-primary" />
          Dashboard - Cargos e Salários
        </h1>
        <p className="text-muted-foreground mt-1">
          Visão geral da estrutura de cargos e salários
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Cargos</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cargos.length}</div>
            <p className="text-xs text-muted-foreground">
              Cargos ativos cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Colaboradores</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{funcionariosAtivos.length}</div>
            <p className="text-xs text-muted-foreground">
              Funcionários ativos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média Salarial</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(mediaSalarial)}</div>
            <p className="text-xs text-muted-foreground">
              Média geral da empresa
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Setores</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{setores.length}</div>
            <p className="text-xs text-muted-foreground">
              Setores cadastrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Níveis Hierárquicos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(cargos.map(c => c.nivel_hierarquico).filter(Boolean)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              Níveis diferentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Preenchimento</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cargos.length > 0 ? Math.round((Object.keys(funcionariosPorCargo).length / cargos.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Cargos com colaboradores
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cargos Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Cargos Cadastrados Recentemente</CardTitle>
        </CardHeader>
        <CardContent>
          {cargos.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum cargo cadastrado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cargos.slice(0, 5).map((cargo) => {
                const funcionariosNoCargo = funcionariosAtivos.filter(
                  f => f.funcao_id === cargo.id
                ).length;

                return (
                  <div
                    key={cargo.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold">{cargo.nome}</h4>
                      <p className="text-sm text-muted-foreground">
                        {cargo.concrem_setores?.nome || 'Setor não definido'} • {funcionariosNoCargo} colaborador(es)
                      </p>
                    </div>
                    {(cargo.salario_minimo || cargo.salario_maximo) && (
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatCurrency(cargo.salario_minimo || 0)} - {formatCurrency(cargo.salario_maximo || 0)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
