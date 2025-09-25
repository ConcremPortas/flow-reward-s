// Página Faltas/Advertências - conectada ao banco de dados
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useFaltasAdvertencias } from "@/hooks/useFaltasAdvertencias";

export const FaltasAdvertencias = () => {
  const { funcionarios, loading } = useFuncionarios();
  const { registros, loading: registrosLoading, createRegistro, updateRegistro, deleteRegistro } = useFaltasAdvertencias();
  const [searchTerm, setSearchTerm] = useState("");
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState("");
  const [tipo, setTipo] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [gravidade, setGravidade] = useState("leve");
  const [editingRecord, setEditingRecord] = useState<string | null>(null);

  const filteredFuncionarios = funcionarios.filter(funcionario =>
    funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!funcionarioSelecionado || !tipo || !quantidade.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    const quantidadeNum = parseInt(quantidade);
    
    // Criar apenas um registro com a quantidade total
    await createRegistro({
      funcionario_id: funcionarioSelecionado,
      tipo,
      motivo: `${tipo} - ${quantidadeNum} ocorrência(s)`,
      gravidade,
      quantidade: quantidadeNum,
      data_ocorrencia: new Date().toISOString().split('T')[0],
      descricao: `${quantidadeNum} ${tipo}(s) registrada(s) - ${gravidade}`
    });
    
    // Reset form
    setFuncionarioSelecionado("");
    setTipo("");
    setQuantidade("");
    setGravidade("leve");
    setEditingRecord(null);
  };

  const handleEdit = (registro: any) => {
    setFuncionarioSelecionado(registro.funcionario_id);
    setTipo(registro.tipo);
    setQuantidade(registro.quantidade?.toString() || "1");
    setGravidade(registro.gravidade);
    setEditingRecord(registro.id);
  };

  const handleUpdate = async () => {
    if (!funcionarioSelecionado || !tipo || !quantidade.trim() || !editingRecord) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    const quantidadeNum = parseInt(quantidade);
    
    await updateRegistro(editingRecord, {
      funcionario_id: funcionarioSelecionado,
      tipo,
      motivo: `${tipo} - ${quantidadeNum} ocorrência(s)`,
      gravidade,
      quantidade: quantidadeNum,
      descricao: `${quantidadeNum} ${tipo}(s) registrada(s) - ${gravidade}`
    });
    
    // Reset form
    setFuncionarioSelecionado("");
    setTipo("");
    setQuantidade("");
    setGravidade("leve");
    setEditingRecord(null);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este registro?")) {
      await deleteRegistro(id);
    }
  };

  const handleCancel = () => {
    setFuncionarioSelecionado("");
    setTipo("");
    setQuantidade("");
    setGravidade("leve");
    setEditingRecord(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando faltas/advertências...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Novo/Editar Registro */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>{editingRecord ? "Editar" : "Novo"} Registro de Faltas/Advertências</CardTitle>
          <CardDescription>
            {editingRecord ? "Edite o registro selecionado" : "Registre faltas e advertências de funcionários"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Funcionário *</label>
              <Select value={funcionarioSelecionado} onValueChange={setFuncionarioSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o funcionário" />
                </SelectTrigger>
                <SelectContent>
                  {funcionarios.filter(f => f.ativo).map(funcionario => (
                    <SelectItem key={funcionario.id} value={funcionario.id}>
                      {funcionario.nome} - {funcionario.setor?.nome || "Sem setor"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo *</label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="falta">Falta</SelectItem>
                  <SelectItem value="advertencia">Advertência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade *</label>
              <Input
                type="number"
                min="1"
                placeholder="Ex: 2"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Gravidade</label>
              <Select value={gravidade} onValueChange={setGravidade}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="leve">Leve</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="grave">Grave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              className="gap-2" 
              onClick={editingRecord ? handleUpdate : handleSave}
              disabled={!funcionarioSelecionado || !tipo || !quantidade.trim()}
            >
              <Plus className="h-4 w-4" />
              {editingRecord ? "Atualizar" : "Adicionar"} Registro
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

          {/* Lista de registros */}
          {registrosLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg">Carregando registros...</div>
            </div>
          ) : registros.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Gravidade</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros
                    .filter(registro => 
                      !searchTerm || 
                      funcionarios.find(f => f.id === registro.funcionario_id)
                        ?.nome.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                    .map((registro) => {
                      const funcionario = funcionarios.find(f => f.id === registro.funcionario_id);
                      return (
                        <TableRow key={registro.id}>
                          <TableCell className="font-medium">
                            {funcionario?.nome || "Funcionário não encontrado"}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              registro.tipo === 'falta' 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {registro.tipo === 'falta' ? 'Falta' : 'Advertência'}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {registro.quantidade || 1}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              registro.gravidade === 'leve' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : registro.gravidade === 'media'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {registro.gravidade?.charAt(0).toUpperCase() + registro.gravidade?.slice(1)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {format(new Date(registro.data_ocorrencia), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {registro.descricao || registro.motivo}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(registro)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(registro.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          ) : funcionarios.length > 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              <p>Nenhum registro de falta ou advertência ainda.</p>
              <p className="text-sm">Os registros aparecerão aqui após serem cadastrados.</p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              <p>Nenhum funcionário cadastrado ainda.</p>
              <p className="text-sm">Cadastre funcionários para registrar faltas e advertências.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};