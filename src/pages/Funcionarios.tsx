import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Eye, Edit, FileText } from "lucide-react";

// Dados de exemplo
const funcionarios = [
  {
    id: 1,
    codigo: "FN001",
    nome: "João Silva Santos",
    setor: "Produção",
    funcao: "Operador",
    categoria: "CLT",
    categoriaBônus: "Faixa A",
    status: "active" as const,
    basePremiacao: "Produtividade",
    empresa: "Empresa Principal",
    valorFixo: 1500.00
  },
  {
    id: 2,
    codigo: "FN002", 
    nome: "Maria Santos Oliveira",
    setor: "Qualidade",
    funcao: "Analista",
    categoria: "CLT",
    categoriaBônus: "Faixa B",
    status: "active" as const,
    basePremiacao: "Qualidade",
    empresa: "Empresa Principal",
    valorFixo: 2200.00
  },
  {
    id: 3,
    codigo: "FN003",
    nome: "Carlos Eduardo Lima",
    setor: "Montagem",
    funcao: "Montador",
    categoria: "CLT",
    categoriaBônus: "Faixa A",
    status: "ferias" as const,
    basePremiacao: "Produtividade",
    empresa: "Empresa Principal",
    valorFixo: 1800.00
  },
  {
    id: 4,
    codigo: "FN004",
    nome: "Ana Paula Costa",
    setor: "Expedição",
    funcao: "Expedidora",
    categoria: "CLT",
    categoriaBônus: "Faixa B",
    status: "active" as const,
    basePremiacao: "Logística",
    empresa: "Empresa Secundária",
    valorFixo: 1600.00
  },
  {
    id: 5,
    codigo: "FN005",
    nome: "Roberto Alves Pereira",
    setor: "Produção",
    funcao: "Supervisor",
    categoria: "CLT",
    categoriaBônus: "Faixa C",
    status: "inactive" as const,
    basePremiacao: "Liderança",
    empresa: "Empresa Principal",
    valorFixo: 3500.00
  }
];

const setores = ["Todos", "Produção", "Qualidade", "Montagem", "Expedição"];
const statusOptions = ["Todos", "Ativo", "Férias", "Rescisão"];

export const Funcionarios = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSetor, setSelectedSetor] = useState("Todos");
  const [selectedStatus, setSelectedStatus] = useState("Todos");

  const filteredFuncionarios = funcionarios.filter(funcionario => {
    const matchesSearch = funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         funcionario.codigo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSetor = selectedSetor === "Todos" || funcionario.setor === selectedSetor;
    const matchesStatus = selectedStatus === "Todos" || 
                         (selectedStatus === "Ativo" && funcionario.status === "active") ||
                         (selectedStatus === "Férias" && funcionario.status === "ferias") ||
                         (selectedStatus === "Rescisão" && funcionario.status === "inactive");
    
    return matchesSearch && matchesSetor && matchesStatus;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Gestão de Funcionários</CardTitle>
              <CardDescription>
                Cadastro e controle de funcionários do sistema
              </CardDescription>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Funcionário
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedSetor} onValueChange={setSelectedSetor}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por setor" />
              </SelectTrigger>
              <SelectContent>
                {setores.map(setor => (
                  <SelectItem key={setor} value={setor}>{setor}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Exportar
            </Button>
          </div>

          {/* Tabela */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Categoria Bônus</TableHead>
                  <TableHead>Valor Fixo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFuncionarios.map((funcionario) => (
                  <TableRow key={funcionario.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{funcionario.codigo}</TableCell>
                    <TableCell>{funcionario.nome}</TableCell>
                    <TableCell>{funcionario.setor}</TableCell>
                    <TableCell>{funcionario.funcao}</TableCell>
                    <TableCell>
                      <StatusBadge status={funcionario.status} />
                    </TableCell>
                    <TableCell>{funcionario.categoriaBônus}</TableCell>
                    <TableCell>{formatCurrency(funcionario.valorFixo)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Eye className="h-3 w-3" />
                          Ver
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <Edit className="h-3 w-3" />
                          Editar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Footer with pagination info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Mostrando {filteredFuncionarios.length} de {funcionarios.length} funcionários
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>Anterior</Button>
              <span className="text-sm">Página 1 de 1</span>
              <Button variant="outline" size="sm" disabled>Próxima</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};