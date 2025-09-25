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
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Edit, TrendingUp, TrendingDown, Minus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSetores } from "@/hooks/useSetores";
import { useTiposIndicadores } from "@/hooks/useTiposIndicadores";

// Hook específico para indicadores do setor (vamos usar os dados de produção como base)
import { useProducaoSetor } from "@/hooks/useProducaoSetor";

export const IndicadoresSetor = () => {
  const { setores, loading: setoresLoading } = useSetores();
  const { tiposIndicadores, loading: tiposLoading } = useTiposIndicadores();
  const { registros, loading: registrosLoading, createRegistro, updateRegistro, deleteRegistro } = useProducaoSetor();
  const [searchTerm, setSearchTerm] = useState("");
  const [setorSelecionado, setSetorSelecionado] = useState("");
  const [competencia, setCompetencia] = useState("");
  const [metaEficiencia, setMetaEficiencia] = useState("");
  const [eficienciaRealizada, setEficienciaRealizada] = useState("");
  const [tipoIndicador, setTipoIndicador] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [editingRecord, setEditingRecord] = useState<string | null>(null);

  // Filtrar registros e calcular indicadores baseados na produção
  const filteredIndicadores = registros.filter(item =>
    item.setor?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    format(new Date(item.data_producao), "MM/yyyy", { locale: ptBR }).includes(searchTerm)
  );

  const calcularEficiencia = (realizado: number, meta: number) => {
    return Math.round((realizado / meta) * 100);
  };

  const getStatusIcon = (percentual: number) => {
    if (percentual >= 100) return <TrendingUp className="h-4 w-4 text-success" />;
    if (percentual >= 95) return <Minus className="h-4 w-4 text-status-warning" />;
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  const getStatusColor = (percentual: number) => {
    if (percentual >= 100) return "text-success";
    if (percentual >= 95) return "text-status-warning";
    return "text-destructive";
  };

  const handleSave = async () => {
    if (!setorSelecionado || !competencia || !metaEficiencia || !eficienciaRealizada || !tipoIndicador) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const registro = {
      setor_id: setorSelecionado,
      data_producao: competencia,
      meta_diaria: parseFloat(metaEficiencia),
      producao_realizada: parseFloat(eficienciaRealizada),
      unidade_medida: "percentual",
      observacoes: `Indicador: ${tiposIndicadores.find(t => t.id === tipoIndicador)?.nome} (${tiposIndicadores.find(t => t.id === tipoIndicador)?.codigo}) - ${observacoes || "Sem observações"}`
    };

    if (editingRecord) {
      await updateRegistro(editingRecord, registro);
    } else {
      await createRegistro(registro);
    }

    // Reset form
    setSetorSelecionado("");
    setCompetencia("");
    setMetaEficiencia("");
    setEficienciaRealizada("");
    setTipoIndicador("");
    setObservacoes("");
    setEditingRecord(null);
  };

  const handleEdit = (registro: any) => {
    setSetorSelecionado(registro.setor_id);
    setCompetencia(registro.data_producao);
    setMetaEficiencia(registro.meta_diaria.toString());
    setEficienciaRealizada(registro.producao_realizada.toString());
    // Extrair tipo do indicador das observações
    const tipoFromObs = registro.observacoes?.includes("Indicador:") ? 
      registro.observacoes.split("(")[1]?.split(")")[0] : "";
    const tipoEncontrado = tiposIndicadores.find(t => t.codigo === tipoFromObs);
    setTipoIndicador(tipoEncontrado?.id || "");
    setObservacoes(registro.observacoes?.split(" - ")[1] || "");
    setEditingRecord(registro.id);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este indicador?")) {
      await deleteRegistro(id);
    }
  };

  const handleCancel = () => {
    setSetorSelecionado("");
    setCompetencia("");
    setMetaEficiencia("");
    setEficienciaRealizada("");
    setTipoIndicador("");
    setObservacoes("");
    setEditingRecord(null);
  };

  if (setoresLoading || registrosLoading || tiposLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Novo Registro */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>{editingRecord ? "Editar" : "Registrar"} Indicador por Setor</CardTitle>
          <CardDescription>
            {editingRecord ? "Edite o indicador selecionado" : "Registre metas e realizações de indicadores específicos por setor"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Setor *</label>
              <Select value={setorSelecionado} onValueChange={setSetorSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {setores.filter(s => s.ativo).map(setor => (
                    <SelectItem key={setor.id} value={setor.id}>
                      {setor.nome} {setor.empresa && `- ${setor.empresa.nome}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Competência *</label>
              <Input
                type="date"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo de Indicador *</label>
              <Select value={tipoIndicador} onValueChange={setTipoIndicador}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de indicador" />
                </SelectTrigger>
                <SelectContent>
                  {tiposIndicadores.map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome} ({tipo.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Meta (%)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="Ex: 95.0"
                min="0"
                max="100"
                value={metaEficiencia}
                onChange={(e) => setMetaEficiencia(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Realizado (%)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="Ex: 98.5"
                min="0"
                max="100"
                value={eficienciaRealizada}
                onChange={(e) => setEficienciaRealizada(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Observações</label>
              <Input
                placeholder="Observações opcionais..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </div>

          {/* Prévia do cálculo */}
          {metaEficiencia && eficienciaRealizada && (
            <div className="p-4 bg-accent/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Atingimento da Meta:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(calcularEficiencia(Number(eficienciaRealizada), Number(metaEficiencia)))}
                  <span className={cn(
                    "text-lg font-bold",
                    getStatusColor(calcularEficiencia(Number(eficienciaRealizada), Number(metaEficiencia)))
                  )}>
                    {calcularEficiencia(Number(eficienciaRealizada), Number(metaEficiencia))}%
                  </span>
                </div>
              </div>
              <Progress 
                value={Math.min(calcularEficiencia(Number(eficienciaRealizada), Number(metaEficiencia)), 100)} 
                className="mt-2"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              className="gap-2" 
              onClick={handleSave}
              disabled={!setorSelecionado || !competencia || !metaEficiencia || !eficienciaRealizada || !tipoIndicador}
            >
              <Plus className="h-4 w-4" />
              {editingRecord ? "Atualizar" : "Adicionar"} Registro
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dados de Indicadores */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Indicadores por Setor</CardTitle>
              <CardDescription>
                Performance dos indicadores específicos de cada setor
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
                placeholder="Buscar por setor ou período..."
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
                  <TableHead>Setor</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead className="text-center">Meta (%)</TableHead>
                  <TableHead className="text-center">Realizado (%)</TableHead>
                  <TableHead>Atingimento</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIndicadores.map((item) => {
                  const eficiencia = calcularEficiencia(item.producao_realizada, item.meta_diaria);
                  // Extrair tipo do indicador das observações
                  const tipoFromObs = item.observacoes?.includes("Indicador:") ? 
                    item.observacoes.split("(")[1]?.split(")")[0] : "";
                  const tipoIndicadorInfo = tiposIndicadores.find(t => t.codigo === tipoFromObs);
                  
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        {item.setor?.nome || "Setor não encontrado"}
                        {item.setor?.empresa && (
                          <div className="text-xs text-muted-foreground">
                            {item.setor.empresa.nome}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {format(new Date(item.data_producao), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="text-center">{item.meta_diaria}%</TableCell>
                      <TableCell className="text-center">{item.producao_realizada}%</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(eficiencia)}
                          <span className={cn("font-medium", getStatusColor(eficiencia))}>
                            {eficiencia}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress 
                            value={Math.min(eficiencia, 100)} 
                            className="h-2"
                          />
                          <div className="text-xs text-muted-foreground">
                            {eficiencia >= 100 ? "Meta superada" : 
                             eficiencia >= 95 ? "Próximo da meta" : 
                             "Abaixo da meta"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {tipoIndicadorInfo ? (
                          <div>
                            <span className="font-medium">{tipoIndicadorInfo.codigo}</span>
                            <div className="text-xs">{tipoIndicadorInfo.nome}</div>
                          </div>
                        ) : (
                          "N/A"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(item.id)}
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

          {/* Cards de Resumo */}
          {filteredIndicadores.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
              {filteredIndicadores.slice(0, 4).map((item) => {
                const eficiencia = calcularEficiencia(item.producao_realizada, item.meta_diaria);
                return (
                  <Card key={item.id} className="card-elegant">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{item.setor?.nome}</h4>
                        {getStatusIcon(eficiencia)}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Meta:</span>
                          <span>{item.meta_diaria}%</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Realizado:</span>
                          <span className={getStatusColor(eficiencia)}>{item.producao_realizada}%</span>
                        </div>
                        <Progress value={Math.min(eficiencia, 100)} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};