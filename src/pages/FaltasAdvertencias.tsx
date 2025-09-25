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
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useFaltasAdvertencias } from "@/hooks/useFaltasAdvertencias";

export const FaltasAdvertencias = () => {
  const { funcionarios, loading } = useFuncionarios();
  const { createRegistro } = useFaltasAdvertencias();
  const [searchTerm, setSearchTerm] = useState("");
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState("");
  const [tipo, setTipo] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [gravidade, setGravidade] = useState("leve");

  const filteredFuncionarios = funcionarios.filter(funcionario =>
    funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = async () => {
    if (!funcionarioSelecionado || !tipo || !quantidade.trim()) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }
    
    const quantidadeNum = parseInt(quantidade);
    
    // Criar múltiplos registros baseado na quantidade
    for (let i = 0; i < quantidadeNum; i++) {
      await createRegistro({
        funcionario_id: funcionarioSelecionado,
        tipo,
        motivo: `${tipo} registrada - quantidade ${i + 1} de ${quantidadeNum}`,
        gravidade,
        data_ocorrencia: new Date().toISOString().split('T')[0],
        descricao: `Registro automático de ${tipo} - ${gravidade}`
      });
    }
    
    // Reset form
    setFuncionarioSelecionado("");
    setTipo("");
    setQuantidade("");
    setGravidade("leve");
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
      {/* Novo Registro */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Novo Registro de Faltas/Advertências</CardTitle>
          <CardDescription>
            Registre faltas e advertências de funcionários
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
            <Button variant="outline" onClick={() => {
              setFuncionarioSelecionado("");
              setTipo("");
              setQuantidade("");
              setGravidade("leve");
            }}>
              Cancelar
            </Button>
            <Button 
              className="gap-2" 
              onClick={handleSave}
              disabled={!funcionarioSelecionado || !tipo || !quantidade.trim()}
            >
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

          {/* Mensagem quando não há dados */}
          {funcionarios.length > 0 ? (
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