// Página de gestão de funcionários - v2.0
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
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useEmpresas } from "@/hooks/useEmpresas";
import { useSetores } from "@/hooks/useSetores";
import { useFuncoes } from "@/hooks/useFuncoes";
import { useCategorias } from "@/hooks/useCategorias";
import { useBasePremiacao } from "@/hooks/useBasePremiacao";
import { useFaixas } from "@/hooks/useFaixas";

export const Funcionarios = () => {
  // Componente de gestão de funcionários conectado ao banco de dados
  const { funcionarios, loading, createFuncionario, updateFuncionario, deleteFuncionario } = useFuncionarios();
  const { empresas } = useEmpresas();
  const { setores } = useSetores();
  const { funcoes } = useFuncoes();
  const { categorias } = useCategorias();
  const { bases } = useBasePremiacao();
  const { faixas } = useFaixas();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSetor, setSelectedSetor] = useState("Todos");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState<any>(null);
  const [formData, setFormData] = useState({
    nome: "",
    empresa_id: "",
    setor_id: "",
    funcao_id: "",
    categoria_id: "",
    data_admissao: ""
  });

  const filteredFuncionarios = funcionarios.filter(funcionario => {
    const matchesSearch = funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSetor = selectedSetor === "Todos" || funcionario.setor?.nome === selectedSetor;
    const matchesStatus = selectedStatus === "Todos" || 
                         (selectedStatus === "Ativo" && funcionario.ativo) ||
                         (selectedStatus === "Inativo" && !funcionario.ativo);
    
    return matchesSearch && matchesSetor && matchesStatus;
  });

  const formatCurrency = (value?: number) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleAdd = () => {
    setFormData({
      nome: "",
      empresa_id: "",
      setor_id: "",
      funcao_id: "",
      categoria_id: "",
      data_admissao: ""
    });
    setIsAddOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) return;
    
    const funcionarioData = {
      nome: formData.nome,
      data_admissao: formData.data_admissao || undefined,
      empresa_id: formData.empresa_id || undefined,
      setor_id: formData.setor_id || undefined,
      funcao_id: formData.funcao_id || undefined,
      categoria_id: formData.categoria_id || undefined,
      ativo: true
    };

    console.log('Dados sendo enviados:', funcionarioData);
    
    await createFuncionario(funcionarioData);
    
    setIsAddOpen(false);
    setFormData({
      nome: "",
      empresa_id: "",
      setor_id: "",
      funcao_id: "",
      categoria_id: "",
      data_admissao: ""
    });
  };

  const handleView = (funcionario: any) => {
    setSelectedFuncionario(funcionario);
    setIsViewOpen(true);
  };

  const handleEdit = (funcionario: any) => {
    setSelectedFuncionario(funcionario);
    setFormData({
      nome: funcionario.nome,
      data_admissao: funcionario.data_admissao || "",
      empresa_id: funcionario.empresa_id || "",
      setor_id: funcionario.setor_id || "",
      funcao_id: funcionario.funcao_id || "",
      categoria_id: funcionario.categoria_id || ""
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!formData.nome.trim() || !selectedFuncionario) return;
    
    const updateData = {
      nome: formData.nome,
      data_admissao: formData.data_admissao || undefined,
      empresa_id: formData.empresa_id || undefined,
      setor_id: formData.setor_id || undefined,
      funcao_id: formData.funcao_id || undefined,
      categoria_id: formData.categoria_id || undefined,
    };

    console.log('Dados sendo atualizados:', updateData);
    
    await updateFuncionario(selectedFuncionario.id, updateData);
    
    setIsEditOpen(false);
    setSelectedFuncionario(null);
  };

  const setorOptions = ["Todos", ...setores.map(s => s.nome)];
  const statusOptions = ["Todos", "Ativo", "Inativo"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando funcionários...</div>
      </div>
    );
  }

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
                    <Label htmlFor="nome">Nome do Funcionário *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      placeholder="Nome completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="data_admissao">Data de Admissão</Label>
                    <Input
                      id="data_admissao"
                      type="date"
                      value={formData.data_admissao}
                      onChange={(e) => setFormData({...formData, data_admissao: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="empresa">Empresa *</Label>
                    <Select value={formData.empresa_id} onValueChange={(value) => setFormData({...formData, empresa_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {empresas.map(empresa => (
                          <SelectItem key={empresa.id} value={empresa.id}>
                            {empresa.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="setor">Setor *</Label>
                    <Select value={formData.setor_id} onValueChange={(value) => setFormData({...formData, setor_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar setor" />
                      </SelectTrigger>
                      <SelectContent>
                        {setores.map(setor => (
                          <SelectItem key={setor.id} value={setor.id}>
                            {setor.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="funcao">Função *</Label>
                    <Select value={formData.funcao_id} onValueChange={(value) => setFormData({...formData, funcao_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar função" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcoes.map(funcao => (
                          <SelectItem key={funcao.id} value={funcao.id}>
                            {funcao.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Select value={formData.categoria_id} onValueChange={(value) => setFormData({...formData, categoria_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map(categoria => (
                          <SelectItem key={categoria.id} value={categoria.id}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={!formData.nome.trim()}>
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
                placeholder="Buscar por nome..."
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
                {setorOptions.map(setor => (
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
                  <TableHead>Nome</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFuncionarios.map((funcionario) => (
                  <TableRow key={funcionario.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{funcionario.nome}</TableCell>
                    <TableCell>{funcionario.setor?.nome || "Não informado"}</TableCell>
                    <TableCell>{funcionario.funcao?.nome || "Não informado"}</TableCell>
                    <TableCell>{funcionario.categoria?.nome || "Não informado"}</TableCell>
                    <TableCell>{funcionario.empresa?.nome || "Não informado"}</TableCell>
                    <TableCell>
                      <StatusBadge status={funcionario.ativo ? "active" : "inactive"} />
                    </TableCell>
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
          </div>
        </CardContent>
      </Card>

      {/* Modal de Visualização */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Funcionário</DialogTitle>
          </DialogHeader>
          {selectedFuncionario && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label className="font-semibold">Nome</Label>
                <p className="text-sm">{selectedFuncionario.nome}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Data de Admissão</Label>
                <p className="text-sm">
                  {selectedFuncionario.data_admissao 
                    ? new Date(selectedFuncionario.data_admissao).toLocaleDateString('pt-BR')
                    : "Não informado"
                  }
                </p>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Empresa</Label>
                <p className="text-sm">{selectedFuncionario.empresa?.nome || "Não informado"}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Setor</Label>
                <p className="text-sm">{selectedFuncionario.setor?.nome || "Não informado"}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Função</Label>
                <p className="text-sm">{selectedFuncionario.funcao?.nome || "Não informado"}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Categoria</Label>
                <p className="text-sm">{selectedFuncionario.categoria?.nome || "Não informado"}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Status</Label>
                <StatusBadge status={selectedFuncionario.ativo ? "active" : "inactive"} />
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

      {/* Modal de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_nome">Nome *</Label>
              <Input
                id="edit_nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_data_admissao">Data de Admissão</Label>
              <Input
                id="edit_data_admissao"
                type="date"
                value={formData.data_admissao}
                onChange={(e) => setFormData({...formData, data_admissao: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_empresa">Empresa</Label>
              <Select value={formData.empresa_id} onValueChange={(value) => setFormData({...formData, empresa_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map(empresa => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_setor">Setor</Label>
              <Select value={formData.setor_id} onValueChange={(value) => setFormData({...formData, setor_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar setor" />
                </SelectTrigger>
                <SelectContent>
                  {setores.map(setor => (
                    <SelectItem key={setor.id} value={setor.id}>
                      {setor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_funcao">Função</Label>
              <Select value={formData.funcao_id} onValueChange={(value) => setFormData({...formData, funcao_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar função" />
                </SelectTrigger>
                <SelectContent>
                  {funcoes.map(funcao => (
                    <SelectItem key={funcao.id} value={funcao.id}>
                      {funcao.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_categoria">Categoria</Label>
              <Select value={formData.categoria_id} onValueChange={(value) => setFormData({...formData, categoria_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(categoria => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.nome.trim()}>
              Atualizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};