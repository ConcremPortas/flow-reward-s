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
  const { funcionarios, loading, createFuncionario } = useFuncionarios();
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
  const [formData, setFormData] = useState({
    cod_funcionario: "",
    nome: "",
    email: "",
    telefone: "",
    cpf: "",
    data_nascimento: "",
    data_admissao: "",
    empresa_id: "",
    setor_id: "",
    funcao_id: "",
    categoria_id: "",
    categoria_bonus_id: "",
    base_premiacao_id: "",
    salario: "",
    valor_fixo: ""
  });

  const filteredFuncionarios = funcionarios.filter(funcionario => {
    const matchesSearch = funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (funcionario.email && funcionario.email.toLowerCase().includes(searchTerm.toLowerCase()));
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
      email: "",
      telefone: "",
      cpf: "",
      data_nascimento: "",
      data_admissao: "",
      empresa_id: "",
      setor_id: "",
      funcao_id: "",
      categoria_id: "",
      categoria_bonus_id: "",
      base_premiacao_id: "",
      salario: "",
      valor_fixo: ""
    });
    setIsAddOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) return;
    
    await createFuncionario({
      nome: formData.nome,
      cpf: formData.cpf || undefined,
      email: formData.email || undefined,
      telefone: formData.telefone || undefined,
      data_nascimento: formData.data_nascimento || undefined,
      data_admissao: formData.data_admissao || undefined,
      empresa_id: formData.empresa_id || undefined,
      setor_id: formData.setor_id || undefined,
      funcao_id: formData.funcao_id || undefined,
      categoria_id: formData.categoria_id || undefined,
      salario: formData.salario ? parseFloat(formData.salario) : undefined,
      ativo: true
    });
    
    setIsAddOpen(false);
    setFormData({
      cod_funcionario: "",
      nome: "",
      email: "",
      telefone: "",
      cpf: "",
      data_nascimento: "",
      data_admissao: "",
      empresa_id: "",
      setor_id: "",
      funcao_id: "",
      categoria_id: "",
      categoria_bonus_id: "",
      base_premiacao_id: "",
      salario: "",
      valor_fixo: ""
    });
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
                    <Label htmlFor="cod_funcionario">COD Funcionário *</Label>
                    <Input
                      id="cod_funcionario"
                      value={formData.cod_funcionario}
                      onChange={(e) => setFormData({...formData, cod_funcionario: e.target.value})}
                      placeholder="Código do funcionário"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nome">Funcionário *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      placeholder="Nome completo"
                    />
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
                    <Label htmlFor="categoria_bonus">Categoria Bônus *</Label>
                    <Select value={formData.categoria_bonus_id} onValueChange={(value) => setFormData({...formData, categoria_bonus_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar categoria bônus" />
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
                    <Label htmlFor="data_nascimento">Data *</Label>
                    <Input
                      id="data_nascimento"
                      type="date"
                      value={formData.data_nascimento}
                      onChange={(e) => setFormData({...formData, data_nascimento: e.target.value})}
                    />
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
                    <Label htmlFor="valor_fixo">Valor Fixo (R$) *</Label>
                    <Input
                      id="valor_fixo"
                      value={formData.valor_fixo}
                      onChange={(e) => setFormData({...formData, valor_fixo: e.target.value})}
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => setFormData({...formData, cpf: e.target.value})}
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                      placeholder="(11) 99999-9999"
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
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="salario">Salário</Label>
                    <Input
                      id="salario"
                      value={formData.salario}
                      onChange={(e) => setFormData({...formData, salario: e.target.value})}
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                    />
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
                placeholder="Buscar por nome ou email..."
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
                  <TableHead>Email</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Salário</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFuncionarios.map((funcionario) => (
                  <TableRow key={funcionario.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{funcionario.nome}</TableCell>
                    <TableCell>{funcionario.email || "Não informado"}</TableCell>
                    <TableCell>{funcionario.setor?.nome || "Não informado"}</TableCell>
                    <TableCell>{funcionario.empresa?.nome || "Não informado"}</TableCell>
                    <TableCell>
                      <StatusBadge status={funcionario.ativo ? "active" : "inactive"} />
                    </TableCell>
                    <TableCell>{formatCurrency(funcionario.salario)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          Ver
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-1"
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
    </div>
  );
};