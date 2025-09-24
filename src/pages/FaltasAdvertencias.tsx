import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Search, Edit, Trash2 } from "lucide-react";

// Dados de exemplo
const funcionarios = [
  { id: 1, codigo: "FN001", nome: "João Silva Santos" },
  { id: 2, codigo: "FN002", nome: "Maria Santos Oliveira" },
  { id: 3, codigo: "FN004", nome: "Ana Paula Costa" },
  { id: 4, codigo: "FN006", nome: "Pedro Alves Lima" },
  { id: 5, codigo: "FN007", nome: "Carla Mendes Silva" },
];

const registros = [
  {
    id: 1,
    funcionario: "João Silva Santos",
    codigo: "FN001",
    mesReferencia: "01/2024",
    faltas: 2,
    advertencias: 0,
    observacoes: "Faltas justificadas por atestado médico"
  },
  {
    id: 2,
    funcionario: "Maria Santos Oliveira",
    codigo: "FN002",
    mesReferencia: "01/2024",
    faltas: 0,
    advertencias: 1,
    observacoes: "Advertência verbal por atraso"
  },
  {
    id: 3,
    funcionario: "Pedro Alves Lima",
    codigo: "FN006",
    mesReferencia: "01/2024",
    faltas: 1,
    advertencias: 0,
    observacoes: ""
  }
];

export const FaltasAdvertencias = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState("");
  const [mesReferencia, setMesReferencia] = useState("");
  const [faltas, setFaltas] = useState("");
  const [advertencias, setAdvertencias] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const filteredRegistros = registros.filter(registro =>
    registro.funcionario.toLowerCase().includes(searchTerm.toLowerCase()) ||
    registro.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calcularImpacto = (faltas: number, advertencias: number) => {
    if (faltas === 0 && advertencias === 0) return "Sem impacto";
    if (faltas <= 1 && advertencias <= 1) return "Baixo impacto";
    if (faltas <= 3 && advertencias <= 2) return "Médio impacto";
    return "Alto impacto";
  };

  const getImpactoColor = (faltas: number, advertencias: number) => {
    const impacto = calcularImpacto(faltas, advertencias);
    switch (impacto) {
      case "Sem impacto": return "text-success";
      case "Baixo impacto": return "text-status-warning";
      case "Médio impacto": return "text-orange-500";
      case "Alto impacto": return "text-destructive";
      default: return "text-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Novo Registro */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Novo Registro de Faltas/Advertências</CardTitle>
          <CardDescription>
            Registre faltas e advertências de funcionários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Funcionário</label>
              <Select value={funcionarioSelecionado} onValueChange={setFuncionarioSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {funcionarios.map(funcionario => (
                    <SelectItem key={funcionario.id} value={funcionario.id.toString()}>
                      {funcionario.codigo} - {funcionario.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mês de Referência</label>
              <Input
                type="month"
                value={mesReferencia}
                onChange={(e) => setMesReferencia(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade de Faltas</label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={faltas}
                onChange={(e) => setFaltas(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade de Advertências</label>
              <Input
                type="number"
                min="0"
                placeholder="0"
                value={advertencias}
                onChange={(e) => setAdvertencias(e.target.value)}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Observações</label>
              <Textarea
                placeholder="Detalhes adicionais sobre as faltas ou advertências..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline">Cancelar</Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Registro
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Registros Existentes */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Registros de Faltas e Advertências</CardTitle>
              <CardDescription>
                Histórico de faltas e advertências dos funcionários
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
                placeholder="Buscar funcionário..."
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
                  <TableHead>Código</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Mês Referência</TableHead>
                  <TableHead className="text-center">Faltas</TableHead>
                  <TableHead className="text-center">Advertências</TableHead>
                  <TableHead>Impacto na Premiação</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistros.map((registro) => (
                  <TableRow key={registro.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{registro.codigo}</TableCell>
                    <TableCell>{registro.funcionario}</TableCell>
                    <TableCell>{registro.mesReferencia}</TableCell>
                    <TableCell className="text-center">
                      <span className={registro.faltas > 0 ? "text-destructive font-medium" : "text-success"}>
                        {registro.faltas}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={registro.advertencias > 0 ? "text-destructive font-medium" : "text-success"}>
                        {registro.advertencias}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={getImpactoColor(registro.faltas, registro.advertencias)}>
                        {calcularImpacto(registro.faltas, registro.advertencias)}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{registro.observacoes}</TableCell>
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

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Mostrando {filteredRegistros.length} de {registros.length} registros
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};