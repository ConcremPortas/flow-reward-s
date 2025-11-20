import { useState } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Briefcase, Users, DollarSign, FileText } from 'lucide-react';
import { useCargos } from '@/hooks/useCargos';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function CargosSalarios() {
  const { cargos, loading } = useCargos();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCargos = cargos.filter(cargo =>
    cargo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cargo.concrem_setores?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value?: number) => {
    if (!value) return 'Não definido';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Briefcase className="h-8 w-8 text-primary" />
              Cargos e Salários
            </h1>
            <p className="text-muted-foreground mt-1">
              Gestão completa de cargos e estrutura salarial
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Cargo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Cargos</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cargos.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funcionários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Média Salarial</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ 0,00</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Relatórios</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="cargos" className="space-y-4">
          <TabsList>
            <TabsTrigger value="cargos">Cargos</TabsTrigger>
            <TabsTrigger value="funcionarios">Funcionários</TabsTrigger>
            <TabsTrigger value="estrutura">Estrutura</TabsTrigger>
          </TabsList>

          <TabsContent value="cargos" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle>Lista de Cargos</CardTitle>
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cargos..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : filteredCargos.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {searchTerm ? 'Nenhum cargo encontrado' : 'Nenhum cargo cadastrado ainda'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredCargos.map((cargo) => (
                      <Card key={cargo.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold text-lg">{cargo.nome}</h3>
                                {cargo.nivel_hierarquico && (
                                  <Badge variant="outline">
                                    Nível {cargo.nivel_hierarquico}
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                                {cargo.concrem_setores && (
                                  <span className="flex items-center gap-1">
                                    <Briefcase className="h-3 w-3" />
                                    {cargo.concrem_setores.nome}
                                  </span>
                                )}
                                {(cargo.salario_minimo || cargo.salario_maximo) && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {formatCurrency(cargo.salario_minimo)} - {formatCurrency(cargo.salario_maximo)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                Visualizar
                              </Button>
                              <Button variant="outline" size="sm">
                                Editar
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="funcionarios">
            <Card>
              <CardHeader>
                <CardTitle>Funcionários por Cargo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Funcionalidade em desenvolvimento
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="estrutura">
            <Card>
              <CardHeader>
                <CardTitle>Estrutura Organizacional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Funcionalidade em desenvolvimento
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
