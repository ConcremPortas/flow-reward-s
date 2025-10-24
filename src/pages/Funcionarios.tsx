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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Plus, Search, Eye, Edit, FileText, Users, Trash2 } from "lucide-react";
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
    cod_funcionario: "",
    nome: "",
    empresa_id: "",
    setor_id: "",
    funcao_id: "",
    categoria_id: "",
    base_premiacao_id: "",
    faixa_id: "",
    data_admissao: "",
    status: "Ativo"
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
      cod_funcionario: "",
      nome: "",
      empresa_id: "",
      setor_id: "",
      funcao_id: "",
      categoria_id: "",
      base_premiacao_id: "",
      faixa_id: "",
      data_admissao: "",
      status: "Ativo"
    });
    setIsAddOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) return;
    
    const funcionarioData = {
      nome: formData.nome.trim(),
      cpf: formData.cod_funcionario.trim() || undefined,
      data_admissao: formData.data_admissao || undefined,
      empresa_id: formData.empresa_id || undefined,
      setor_id: formData.setor_id || undefined,
      funcao_id: formData.funcao_id || undefined,
      categoria_id: formData.categoria_id || undefined,
      base_premiacao_id: formData.base_premiacao_id || undefined,
      faixa_id: formData.faixa_id || undefined,
      status: formData.status,
      ativo: true
    };

    console.log('Dados sendo enviados:', funcionarioData);
    
    await createFuncionario(funcionarioData);
    
    setIsAddOpen(false);
    setFormData({
      cod_funcionario: "",
      nome: "",
      empresa_id: "",
      setor_id: "",
      funcao_id: "",
      categoria_id: "",
      base_premiacao_id: "",
      faixa_id: "",
      data_admissao: "",
      status: "Ativo"
    });
  };

  const handleView = (funcionario: any) => {
    setSelectedFuncionario(funcionario);
    setIsViewOpen(true);
  };

  const handleEdit = (funcionario: any) => {
    setSelectedFuncionario(funcionario);
    setFormData({
      cod_funcionario: funcionario.cpf || "",
      nome: funcionario.nome,
      data_admissao: funcionario.data_admissao || "",
      empresa_id: funcionario.empresa_id || "",
      setor_id: funcionario.setor_id || "",
      funcao_id: funcionario.funcao_id || "",
      categoria_id: funcionario.categoria_id || "",
      base_premiacao_id: funcionario.base_premiacao_id || "",
      faixa_id: funcionario.faixa_id || "",
      status: funcionario.status || "Ativo"
    });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!formData.nome.trim() || !selectedFuncionario) return;
    
    const updateData = {
      nome: formData.nome.trim(),
      cpf: formData.cod_funcionario.trim() || undefined,
      data_admissao: formData.data_admissao || undefined,
      empresa_id: formData.empresa_id || undefined,
      setor_id: formData.setor_id || undefined,
      funcao_id: formData.funcao_id || undefined,
      categoria_id: formData.categoria_id || undefined,
      base_premiacao_id: formData.base_premiacao_id || undefined,
      faixa_id: formData.faixa_id || undefined,
      status: formData.status,
    };

    console.log('Dados sendo atualizados:', updateData);
    
    await updateFuncionario(selectedFuncionario.id, updateData);
    
    setIsEditOpen(false);
    setSelectedFuncionario(null);
  };

  const handleDelete = async (funcionario: any) => {
    await deleteFuncionario(funcionario.id);
  };

  const setorOptions = ["Todos", ...setores.map(s => s.nome)];
  const statusOptions = ["Todos", "Ativo", "Inativo"];
  const funcionarioStatusOptions = ["Ativo", "Férias", "Licença", "Rescisão"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando funcionários...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card Informativo */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Vinculação de Setor</h3>
              <p className="text-sm text-muted-foreground">
                O setor do funcionário é fundamental para o cálculo da premiação. Para funcionários auxiliares, 
                a meta de produção do setor será utilizada como base para calcular a nota geral da premiação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
                    <Label htmlFor="cod_funcionario">Cód. Funcionário *</Label>
                    <Input
                      id="cod_funcionario"
                      value={formData.cod_funcionario}
                      onChange={(e) => setFormData({...formData, cod_funcionario: e.target.value})}
                      placeholder="Código do funcionário"
                    />
                  </div>
                  
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="base_premiacao">Base Premiação *</Label>
                    <Select value={formData.base_premiacao_id} onValueChange={(value) => setFormData({...formData, base_premiacao_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar base de premiação" />
                      </SelectTrigger>
                      <SelectContent>
                        {bases.map(base => (
                          <SelectItem key={base.id} value={base.id}>
                            {base.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="faixa">Faixa *</Label>
                    <Select value={formData.faixa_id} onValueChange={(value) => setFormData({...formData, faixa_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar faixa" />
                      </SelectTrigger>
                      <SelectContent>
                        {faixas.map(faixa => (
                          <SelectItem key={faixa.id} value={faixa.id}>
                            {faixa.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar status" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionarioStatusOptions.map(status => (
                          <SelectItem key={status} value={status}>
                            {status}
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
                  <Button onClick={handleSave} disabled={!formData.nome.trim() || !formData.cod_funcionario.trim()}>
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
                  <TableHead>Status Funcional</TableHead>
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
                    <TableCell>{funcionario.status || "Ativo"}</TableCell>
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
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="gap-1 text-destructive hover:text-destructive"
                             >
                               <Trash2 className="h-3 w-3" />
                               Excluir
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Excluir Funcionário</AlertDialogTitle>
                               <AlertDialogDescription>
                                 Tem certeza que deseja excluir o funcionário "{funcionario.nome}"? 
                                 Esta ação irá desativar o funcionário do sistema.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancelar</AlertDialogCancel>
                               <AlertDialogAction 
                                 onClick={() => handleDelete(funcionario)}
                                 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                               >
                                 Excluir
                               </AlertDialogAction>
                             </AlertDialogFooter>
                           </AlertDialogContent>
                         </AlertDialog>
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
                <Label className="font-semibold">Código Funcionário</Label>
                <p className="text-sm">{selectedFuncionario.cpf || "Não informado"}</p>
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
                <Label className="font-semibold">Status</Label>
                <StatusBadge status={selectedFuncionario.ativo ? "active" : "inactive"} />
              </div>
              
              {/* Seção de Vinculação Organizacional */}
              <div className="md:col-span-2 border-t pt-4 mt-4">
                <h4 className="font-semibold text-lg mb-3">Vinculação Organizacional</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">Empresa</Label>
                    <p className="text-sm">{selectedFuncionario.empresa?.nome || "Não informado"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-primary">Setor</Label>
                    <p className="text-sm font-medium">{selectedFuncionario.setor?.nome || "Não informado"}</p>
                    <p className="text-xs text-muted-foreground">Base para cálculo da meta de produção</p>
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
                    <Label className="font-semibold">Base Premiação</Label>
                    <p className="text-sm">{selectedFuncionario.base_premiacao?.nome || "Não informado"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-primary">Faixa</Label>
                    <p className="text-sm font-medium">{selectedFuncionario.faixa?.nome || "Não informado"}</p>
                    <p className="text-xs text-muted-foreground">Base para cálculo da premiação (produção)</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Status</Label>
                    <p className="text-sm font-medium">{selectedFuncionario.status || "Ativo"}</p>
                  </div>
                </div>
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
              <Label htmlFor="edit_cod_funcionario">Cód. Funcionário *</Label>
              <Input
                id="edit_cod_funcionario"
                value={formData.cod_funcionario}
                onChange={(e) => setFormData({...formData, cod_funcionario: e.target.value})}
                placeholder="Código do funcionário"
              />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="edit_base_premiacao">Base Premiação</Label>
              <Select value={formData.base_premiacao_id} onValueChange={(value) => setFormData({...formData, base_premiacao_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar base de premiação" />
                </SelectTrigger>
                <SelectContent>
                  {bases.map(base => (
                    <SelectItem key={base.id} value={base.id}>
                      {base.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_faixa">Faixa</Label>
              <Select value={formData.faixa_id} onValueChange={(value) => setFormData({...formData, faixa_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar faixa" />
                </SelectTrigger>
                <SelectContent>
                  {faixas.map(faixa => (
                    <SelectItem key={faixa.id} value={faixa.id}>
                      {faixa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  {funcionarioStatusOptions.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
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
            <Button onClick={handleUpdate} disabled={!formData.nome.trim() || !formData.cod_funcionario.trim()}>
              Atualizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};