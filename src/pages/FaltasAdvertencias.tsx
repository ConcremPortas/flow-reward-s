// Página Faltas/Advertências - Grid mensal de apuração
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Save, Calendar, Edit, Trash2, Filter } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useFaltasAdvertencias } from "@/hooks/useFaltasAdvertencias";

export const FaltasAdvertencias = () => {
  const { funcionarios, loading } = useFuncionarios();
  const { registros, loading: registrosLoading, createRegistro, updateRegistro, deleteRegistro } = useFaltasAdvertencias();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroMesCompetencia, setFiltroMesCompetencia] = useState("");
  const [mesCompetencia, setMesCompetencia] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  
  // Estado para armazenar as faltas e advertências do grid
  const [dadosApuracao, setDadosApuracao] = useState<{
    [funcionarioId: string]: {
      faltas: number;
      advertencias: number;
    }
  }>({});

  const filteredFuncionarios = funcionarios.filter(funcionario =>
    funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuantidadeChange = (funcionarioId: string, tipo: 'faltas' | 'advertencias', valor: string) => {
    const quantidade = parseInt(valor) || 0;
    setDadosApuracao(prev => ({
      ...prev,
      [funcionarioId]: {
        ...prev[funcionarioId],
        [tipo]: quantidade
      }
    }));
  };

  const handleSalvarApuracao = async () => {
    if (!mesCompetencia) {
      alert("Por favor, selecione o mês de competência");
      return;
    }

    const [ano, mes] = mesCompetencia.split('-');
    const dataApuracao = `${ano}-${mes}-01`;
    
    // Salvar apenas funcionários que têm faltas ou advertências
    const funcionariosComOcorrencias = Object.entries(dadosApuracao).filter(([_, dados]) => 
      dados.faltas > 0 || dados.advertencias > 0
    );

    if (funcionariosComOcorrencias.length === 0) {
      alert("Nenhuma falta ou advertência foi lançada para salvar");
      return;
    }

    for (const [funcionarioId, dados] of funcionariosComOcorrencias) {
      // Salvar faltas se houver
      if (dados.faltas > 0) {
        await createRegistro({
          funcionario_id: funcionarioId,
          tipo: 'falta',
          motivo: `Apuração mensal - ${format(new Date(dataApuracao), "MMMM 'de' yyyy", { locale: ptBR })}`,
          gravidade: 'media',
          quantidade: dados.faltas,
          data_ocorrencia: dataApuracao,
          descricao: `${dados.faltas} falta(s) registrada(s) na apuração mensal`
        });
      }

      // Salvar advertências se houver
      if (dados.advertencias > 0) {
        await createRegistro({
          funcionario_id: funcionarioId,
          tipo: 'advertencia',
          motivo: `Apuração mensal - ${format(new Date(dataApuracao), "MMMM 'de' yyyy", { locale: ptBR })}`,
          gravidade: 'media',
          quantidade: dados.advertencias,
          data_ocorrencia: dataApuracao,
          descricao: `${dados.advertencias} advertência(s) registrada(s) na apuração mensal`
        });
      }
    }

    // Limpar dados após salvar
    setDadosApuracao({});
    alert("Apuração salva com sucesso!");
  };

  const handleEditarRegistro = async (registro: any) => {
    // Aqui você pode implementar a lógica de edição
    const novaQuantidade = prompt(`Editar quantidade de ${registro.tipo}s para ${funcionarios.find(f => f.id === registro.funcionario_id)?.nome}:`, registro.quantidade?.toString());
    
    if (novaQuantidade && parseInt(novaQuantidade) !== registro.quantidade) {
      await updateRegistro(registro.id, {
        quantidade: parseInt(novaQuantidade),
        descricao: `${parseInt(novaQuantidade)} ${registro.tipo}(s) registrada(s) na apuração mensal`
      });
    }
  };

  const handleExcluirRegistro = async (id: string, funcionarioNome: string) => {
    if (confirm(`Tem certeza que deseja excluir este registro de ${funcionarioNome}?`)) {
      await deleteRegistro(id);
    }
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
      {/* Grid de Apuração Mensal */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Apuração Mensal - Faltas e Advertências
          </CardTitle>
          <CardDescription>
            Lance as faltas e advertências do mês de competência para todos os funcionários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mês de Competência *</label>
              <Input
                type="month"
                value={mesCompetencia}
                onChange={(e) => setMesCompetencia(e.target.value)}
                className="w-auto"
              />
            </div>
            <Button 
              onClick={handleSalvarApuracao}
              className="gap-2"
              disabled={Object.keys(dadosApuracao).length === 0}
            >
              <Save className="h-4 w-4" />
              Salvar Apuração
            </Button>
          </div>

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

          {/* Grid de funcionários */}
          {funcionarios.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead className="text-center">Faltas</TableHead>
                    <TableHead className="text-center">Advertências</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFuncionarios
                    .filter(f => f.ativo)
                    .map((funcionario) => (
                      <TableRow key={funcionario.id}>
                        <TableCell className="font-medium">
                          {funcionario.nome}
                        </TableCell>
                        <TableCell>
                          {funcionario.setor?.nome || "Sem setor"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="w-20 text-center"
                            value={dadosApuracao[funcionario.id]?.faltas || ''}
                            onChange={(e) => handleQuantidadeChange(funcionario.id, 'faltas', e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="w-20 text-center"
                            value={dadosApuracao[funcionario.id]?.advertencias || ''}
                            onChange={(e) => handleQuantidadeChange(funcionario.id, 'advertencias', e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              <p>Nenhum funcionário cadastrado ainda.</p>
              <p className="text-sm">Cadastre funcionários para lançar faltas e advertências.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Registros */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Histórico de Apurações</CardTitle>
          <CardDescription>
            Registros históricos de faltas e advertências já lançados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtros:</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Funcionário</label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Buscar funcionário..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Mês Competência</label>
                <Input
                  type="month"
                  value={filtroMesCompetencia}
                  onChange={(e) => setFiltroMesCompetencia(e.target.value)}
                  placeholder="Filtrar por mês"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFiltroMesCompetencia("");
                  }}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </div>
          
          {registrosLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg">Carregando histórico...</div>
            </div>
          ) : registros.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros
                    .filter(registro => {
                      const funcionario = funcionarios.find(f => f.id === registro.funcionario_id);
                      const funcionarioMatch = !searchTerm || funcionario?.nome.toLowerCase().includes(searchTerm.toLowerCase());
                      
                      const dataRegistro = new Date(registro.data_ocorrencia);
                      const mesRegistro = `${dataRegistro.getFullYear()}-${String(dataRegistro.getMonth() + 1).padStart(2, '0')}`;
                      const mesMatch = !filtroMesCompetencia || mesRegistro === filtroMesCompetencia;
                      
                      return funcionarioMatch && mesMatch;
                    })
                    .sort((a, b) => new Date(b.data_ocorrencia).getTime() - new Date(a.data_ocorrencia).getTime())
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
                            {format(new Date(registro.data_ocorrencia), "MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            {registro.descricao || registro.motivo}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditarRegistro(registro)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExcluirRegistro(registro.id, funcionario?.nome || "Funcionário")}
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
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              <p>Nenhuma apuração realizada ainda.</p>
              <p className="text-sm">As apurações aparecerão aqui após serem salvas.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};