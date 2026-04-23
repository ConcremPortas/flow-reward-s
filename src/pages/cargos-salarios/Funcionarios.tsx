import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Users, Briefcase, Building2, Mail } from 'lucide-react';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { Skeleton } from '@/components/ui/skeleton';

export default function FuncionariosCargosSalarios() {
  const { funcionarios, loading } = useFuncionarios();
  const [searchTerm, setSearchTerm] = useState('');

  const funcionariosAtivos = funcionarios.filter(f => {
    const status = (f.status || '').toLowerCase();
    return status !== 'rescisao' && status !== 'rescisão';
  });

  const filteredFuncionarios = funcionariosAtivos.filter(func => {
    const term = searchTerm.toLowerCase();
    return !term ||
      func.nome.toLowerCase().includes(term) ||
      (func.cpf || '').toLowerCase().includes(term) ||
      (func.setor?.nome || '').toLowerCase().includes(term) ||
      (func.categoria?.nome || '').toLowerCase().includes(term) ||
      (func.funcao?.nome || '').toLowerCase().includes(term);
  });

  const formatCurrency = (value?: number | null) => {
    if (!value) return 'Não definido';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            Funcionários
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os funcionários e seus cargos
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Funcionário
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Lista de Funcionários ({filteredFuncionarios.length})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, código, setor ou categoria..."
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
          ) : filteredFuncionarios.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum funcionário encontrado' : 'Nenhum funcionário cadastrado ainda'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFuncionarios.map((func) => (
                <Card key={func.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{func.nome}</h3>
                          {func.status && (
                            <Badge variant="outline">
                              {func.status}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                          {func.funcao && (
                            <span className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {func.funcao.nome}
                            </span>
                          )}
                          {func.setor && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {func.setor.nome}
                            </span>
                          )}
                          {func.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {func.email}
                            </span>
                          )}
                        </div>

                        {func.salario && (
                          <div className="text-sm">
                            <span className="font-medium">Salário: </span>
                            <span className="text-muted-foreground">{formatCurrency(func.salario)}</span>
                          </div>
                        )}
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
    </div>
  );
}
