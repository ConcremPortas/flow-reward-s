import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
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
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState<any>(null);
  const [formData, setFormData] = useState({
    codigo: "",
    nome: "",
    setor: "",
    funcao: "",
    categoria: "",
    categoriaBônus: "",
    status: "",
    basePremiacao: "",
    empresa: "",
    valorFixo: ""
  });

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

  const handleAdd = () => {
    setFormData({
      codigo: "",
      nome: "",
      setor: "",
      funcao: "",
      categoria: "",
      categoriaBônus: "",
      status: "",
      basePremiacao: "",
      empresa: "",
      valorFixo: ""
    });
    setIsAddOpen(true);
  };

  const handleEdit = (funcionario: any) => {
    setSelectedFuncionario(funcionario);
    setFormData({
      codigo: funcionario.codigo,
      nome: funcionario.nome,
      setor: funcionario.setor,
      funcao: funcionario.funcao,
      categoria: funcionario.categoria,
      categoriaBônus: funcionario.categoriaBônus,
      status: funcionario.status,
      basePremiacao: funcionario.basePremiacao,
      empresa: funcionario.empresa,
      valorFixo: funcionario.valorFixo.toString()
    });
    setIsEditOpen(true);
  };

  const handleView = (funcionario: any) => {
    setSelectedFuncionario(funcionario);
    setIsViewOpen(true);
  };

  const handleSave = () => {
    console.log("Salvando funcionário:", formData);
    setIsAddOpen(false);
    setIsEditOpen(false);
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
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={handleAdd}>
                  <Plus className="h-4 w-4" />
                  Novo Funcionário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Novo Funcionário</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="codigo">Código</Label>
                    <Input
                      id="codigo"
                      value={formData.codigo}
                      onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                      placeholder="Ex: FN001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setor">Setor</Label>
                    <Select value={formData.setor} onValueChange={(value) => setFormData({...formData, setor: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar setor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Produção">Produção</SelectItem>
                        <SelectItem value="Qualidade">Qualidade</SelectItem>
                        <SelectItem value="Montagem">Montagem</SelectItem>
                        <SelectItem value="Expedição">Expedição</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="funcao">Função</Label>
                    <Select value={formData.funcao} onValueChange={(value) => setFormData({...formData, funcao: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar função" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Operador">Operador</SelectItem>
                        <SelectItem value="Analista">Analista</SelectItem>
                        <SelectItem value="Coordenador">Coordenador</SelectItem>
                        <SelectItem value="Supervisor">Supervisor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria</Label>
                    <Select value={formData.categoria} onValueChange={(value) => setFormData({...formData, categoria: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CLT">CLT</SelectItem>
                        <SelectItem value="Terceirizado">Terceirizado</SelectItem>
                        <SelectItem value="Estagiário">Estagiário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valorFixo">Valor Fixo</Label>
                    <Input
                      id="valorFixo"
                      value={formData.valorFixo}
                      onChange={(e) => setFormData({...formData, valorFixo: e.target.value})}
                      placeholder="R$ 0,00"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave}>
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
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
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handleView(funcionario)}
                        >
                          <Eye className="h-3 w-3" />
                          Ver
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1"
                          onClick={() => handleEdit(funcionario)}
                        >
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

      {/* Dialog de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-codigo">Código</Label>
              <Input
                id="edit-codigo"
                value={formData.codigo}
                onChange={(e) => setFormData({...formData, codigo: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-nome">Nome</Label>
              <Input
                id="edit-nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-setor">Setor</Label>
              <Select value={formData.setor} onValueChange={(value) => setFormData({...formData, setor: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Produção">Produção</SelectItem>
                  <SelectItem value="Qualidade">Qualidade</SelectItem>
                  <SelectItem value="Montagem">Montagem</SelectItem>
                  <SelectItem value="Expedição">Expedição</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-funcao">Função</Label>
              <Select value={formData.funcao} onValueChange={(value) => setFormData({...formData, funcao: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Operador">Operador</SelectItem>
                  <SelectItem value="Analista">Analista</SelectItem>
                  <SelectItem value="Coordenador">Coordenador</SelectItem>
                  <SelectItem value="Supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de Visualização */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Funcionário</DialogTitle>
          </DialogHeader>
          {selectedFuncionario && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <div className="p-2 bg-muted rounded">{selectedFuncionario.codigo}</div>
              </div>
              <div className="space-y-2">
                <Label>Nome</Label>
                <div className="p-2 bg-muted rounded">{selectedFuncionario.nome}</div>
              </div>
              <div className="space-y-2">
                <Label>Setor</Label>
                <div className="p-2 bg-muted rounded">{selectedFuncionario.setor}</div>
              </div>
              <div className="space-y-2">
                <Label>Função</Label>
                <div className="p-2 bg-muted rounded">{selectedFuncionario.funcao}</div>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="p-2">
                  <StatusBadge status={selectedFuncionario.status} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor Fixo</Label>
                <div className="p-2 bg-muted rounded">{formatCurrency(selectedFuncionario.valorFixo)}</div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};