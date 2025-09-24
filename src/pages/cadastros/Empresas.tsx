import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Plus, Edit, Trash2, Search, Building } from "lucide-react";

// Dados de exemplo
const empresas = [
  {
    id: 1,
    nome: "Empresa Principal",
    cnpj: "12.345.678/0001-90",
    status: "active" as const,
    funcionarios: 85
  },
  {
    id: 2,
    nome: "Empresa Secundária",
    cnpj: "98.765.432/0001-10",
    status: "active" as const,
    funcionarios: 42
  },
  {
    id: 3,
    nome: "Filial Norte",
    cnpj: "11.222.333/0001-44",
    status: "active" as const,
    funcionarios: 28
  },
  {
    id: 4,
    nome: "Empresa Terceirizada",
    cnpj: "55.666.777/0001-88",
    status: "inactive" as const,
    funcionarios: 0
  }
];

export const Empresas = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");

  const filteredEmpresas = empresas.filter(empresa =>
    empresa.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    empresa.cnpj.includes(searchTerm)
  );

  const formatCNPJ = (cnpj: string) => {
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  };

  return (
    <div className="space-y-6">
      {/* Nova Empresa */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Nova Empresa</CardTitle>
          <CardDescription>
            Cadastre uma nova empresa no sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome da Empresa</label>
              <Input
                placeholder="Ex: Empresa Principal"
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">CNPJ</label>
              <Input
                placeholder="Ex: 12.345.678/0001-90"
                value={cnpj}
                onChange={(e) => setCnpj(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline">Cancelar</Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Empresa
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Empresas */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Empresas Cadastradas</CardTitle>
              <CardDescription>
                Empresas registradas no sistema de remuneração
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtro de busca */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar empresas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Tabela */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nome da Empresa</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Funcionários</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmpresas.map((empresa) => (
                  <TableRow key={empresa.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{empresa.nome}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{empresa.cnpj}</TableCell>
                    <TableCell>
                      <StatusBadge status={empresa.status} />
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={empresa.funcionarios > 0 ? "font-medium" : "text-muted-foreground"}>
                        {empresa.funcionarios}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Edit className="h-3 w-3" />
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1 text-destructive hover:text-destructive">
                          <Trash2 className="h-3 w-3" />
                          Excluir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center p-4 bg-accent/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{empresas.filter(e => e.status === 'active').length}</div>
              <div className="text-sm text-muted-foreground">Empresas Ativas</div>
            </div>
            <div className="text-center p-4 bg-accent/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{empresas.reduce((acc, e) => acc + e.funcionarios, 0)}</div>
              <div className="text-sm text-muted-foreground">Total de Funcionários</div>
            </div>
            <div className="text-center p-4 bg-accent/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">{empresas.length}</div>
              <div className="text-sm text-muted-foreground">Total de Empresas</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};