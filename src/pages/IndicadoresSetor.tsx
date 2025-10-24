import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Edit, TrendingUp, TrendingDown, Minus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSetores } from "@/hooks/useSetores";
import { useIndicadoresSetor } from "@/hooks/useIndicadoresSetor";
import { formatDateToBrasilia, formatDateToBrazilian, formatDateToInput } from "@/lib/dateUtils";

export const IndicadoresSetor = () => {
  const { setores, loading: setoresLoading } = useSetores();
  const { indicadores, loading: indicadoresLoading, createIndicador, updateIndicador, deleteIndicador } = useIndicadoresSetor();
  const [searchTerm, setSearchTerm] = useState("");
  const [setorFilter, setSetorFilter] = useState("");
  const [setorSelecionado, setSetorSelecionado] = useState("");
  const [competencia, setCompetencia] = useState("");
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  
  // Estados para os indicadores
  const [horaMaquinaMeta, setHoraMaquinaMeta] = useState("");
  const [horaMaquinaRealizado, setHoraMaquinaRealizado] = useState("");
  const [identificacaoNcMeta, setIdentificacaoNcMeta] = useState("");
  const [identificacaoNcRealizado, setIdentificacaoNcRealizado] = useState("");
  const [limpezaMeta, setLimpezaMeta] = useState("");
  const [limpezaRealizado, setLimpezaRealizado] = useState("");
  const [tratamentoNcMeta, setTratamentoNcMeta] = useState("");
  const [tratamentoNcRealizado, setTratamentoNcRealizado] = useState("");
  const [operacaoSeguraMeta, setOperacaoSeguraMeta] = useState("");
  const [operacaoSeguraRealizado, setOperacaoSeguraRealizado] = useState("");

  // Filtrar indicadores
  const filteredIndicadores = indicadores.filter(item => {
    const monthYear = item.competencia ? `${item.competencia.slice(5,7)}/${item.competencia.slice(0,4)}` : '';
    
    const matchesSearch = item.setor?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         monthYear.includes(searchTerm);
    
    const matchesSetor = !setorFilter || setorFilter === "all" || item.setor_id === setorFilter;
    
    return matchesSearch && matchesSetor;
  });

  const calcularPercentual = (realizado?: string, meta?: string) => {
    if (!meta || !realizado) return 0;
    const metaNum = parseFloat(meta);
    const realizadoNum = parseFloat(realizado);
    if (metaNum === 0) return 0;
    return Math.round((realizadoNum / metaNum) * 100);
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
    if (!setorSelecionado || !competencia) {
      alert("Por favor, selecione o setor e a competência");
      return;
    }

    // Verificar se pelo menos um indicador foi preenchido
    const temIndicador = horaMaquinaMeta || identificacaoNcMeta || limpezaMeta || tratamentoNcMeta || operacaoSeguraMeta;
    if (!temIndicador) {
      alert("Por favor, preencha pelo menos um indicador");
      return;
    }

    const dataFormatada = formatDateToBrasilia(competencia);

    const indicador = {
      setor_id: setorSelecionado,
      competencia: dataFormatada,
      hora_maquina_meta: horaMaquinaMeta ? parseFloat(horaMaquinaMeta) : undefined,
      hora_maquina_realizado: horaMaquinaRealizado ? parseFloat(horaMaquinaRealizado) : undefined,
      identificacao_nc_meta: identificacaoNcMeta ? parseFloat(identificacaoNcMeta) : undefined,
      identificacao_nc_realizado: identificacaoNcRealizado ? parseFloat(identificacaoNcRealizado) : undefined,
      limpeza_meta: limpezaMeta ? parseFloat(limpezaMeta) : undefined,
      limpeza_realizado: limpezaRealizado ? parseFloat(limpezaRealizado) : undefined,
      tratamento_nc_meta: tratamentoNcMeta ? parseFloat(tratamentoNcMeta) : undefined,
      tratamento_nc_realizado: tratamentoNcRealizado ? parseFloat(tratamentoNcRealizado) : undefined,
      operacao_segura_meta: operacaoSeguraMeta ? parseFloat(operacaoSeguraMeta) : undefined,
      operacao_segura_realizado: operacaoSeguraRealizado ? parseFloat(operacaoSeguraRealizado) : undefined,
    };

    if (editingRecord) {
      await updateIndicador(editingRecord, indicador);
    } else {
      await createIndicador(indicador);
    }

    handleCancel();
  };

  const handleEdit = (indicador: any) => {
    setEditingRecord(indicador.id);
    setSetorSelecionado(indicador.setor_id || "");
    setCompetencia(formatDateToInput(indicador.competencia));
    setHoraMaquinaMeta(indicador.hora_maquina_meta?.toString() || "");
    setHoraMaquinaRealizado(indicador.hora_maquina_realizado?.toString() || "");
    setIdentificacaoNcMeta(indicador.identificacao_nc_meta?.toString() || "");
    setIdentificacaoNcRealizado(indicador.identificacao_nc_realizado?.toString() || "");
    setLimpezaMeta(indicador.limpeza_meta?.toString() || "");
    setLimpezaRealizado(indicador.limpeza_realizado?.toString() || "");
    setTratamentoNcMeta(indicador.tratamento_nc_meta?.toString() || "");
    setTratamentoNcRealizado(indicador.tratamento_nc_realizado?.toString() || "");
    setOperacaoSeguraMeta(indicador.operacao_segura_meta?.toString() || "");
    setOperacaoSeguraRealizado(indicador.operacao_segura_realizado?.toString() || "");
  };

  const handleDelete = async (id: string) => {
    await deleteIndicador(id);
  };

  const handleCancel = () => {
    setEditingRecord(null);
    setSetorSelecionado("");
    setCompetencia("");
    setHoraMaquinaMeta("");
    setHoraMaquinaRealizado("");
    setIdentificacaoNcMeta("");
    setIdentificacaoNcRealizado("");
    setLimpezaMeta("");
    setLimpezaRealizado("");
    setTratamentoNcMeta("");
    setTratamentoNcRealizado("");
    setOperacaoSeguraMeta("");
    setOperacaoSeguraRealizado("");
  };

  if (setoresLoading || indicadoresLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulário de Cadastro */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>{editingRecord ? "Editar" : "Registrar"} Indicadores por Setor</CardTitle>
          <CardDescription>
            Performance dos indicadores específicos de cada setor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dados básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Setor *</Label>
              <Select value={setorSelecionado} onValueChange={setSetorSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {setores.filter(s => s.ativo).map(setor => (
                    <SelectItem key={setor.id} value={setor.id}>
                      {setor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Competência *</Label>
              <Input
                type="date"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
              />
            </div>
          </div>

          {/* Indicadores */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Indicadores</h3>
            
            {/* Hora Máquina */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
              <div className="col-span-2">
                <h4 className="font-medium">Hora Máquina</h4>
              </div>
              <div className="space-y-2">
                <Label>Meta</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 100"
                  value={horaMaquinaMeta}
                  onChange={(e) => setHoraMaquinaMeta(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Realizado</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 95"
                  value={horaMaquinaRealizado}
                  onChange={(e) => setHoraMaquinaRealizado(e.target.value)}
                />
              </div>
              {horaMaquinaMeta && horaMaquinaRealizado && (
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(calcularPercentual(horaMaquinaRealizado, horaMaquinaMeta))}
                    <span className={cn("font-medium", getStatusColor(calcularPercentual(horaMaquinaRealizado, horaMaquinaMeta)))}>
                      {calcularPercentual(horaMaquinaRealizado, horaMaquinaMeta)}%
                    </span>
                  </div>
                  <Progress value={Math.min(calcularPercentual(horaMaquinaRealizado, horaMaquinaMeta), 100)} className="mt-2" />
                </div>
              )}
            </div>

            {/* Identificação NC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
              <div className="col-span-2">
                <h4 className="font-medium">Identificação de Não Conformidades</h4>
              </div>
              <div className="space-y-2">
                <Label>Meta</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 100"
                  value={identificacaoNcMeta}
                  onChange={(e) => setIdentificacaoNcMeta(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Realizado</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 98"
                  value={identificacaoNcRealizado}
                  onChange={(e) => setIdentificacaoNcRealizado(e.target.value)}
                />
              </div>
              {identificacaoNcMeta && identificacaoNcRealizado && (
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(calcularPercentual(identificacaoNcRealizado, identificacaoNcMeta))}
                    <span className={cn("font-medium", getStatusColor(calcularPercentual(identificacaoNcRealizado, identificacaoNcMeta)))}>
                      {calcularPercentual(identificacaoNcRealizado, identificacaoNcMeta)}%
                    </span>
                  </div>
                  <Progress value={Math.min(calcularPercentual(identificacaoNcRealizado, identificacaoNcMeta), 100)} className="mt-2" />
                </div>
              )}
            </div>

            {/* Limpeza */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
              <div className="col-span-2">
                <h4 className="font-medium">Limpeza</h4>
              </div>
              <div className="space-y-2">
                <Label>Meta</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 100"
                  value={limpezaMeta}
                  onChange={(e) => setLimpezaMeta(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Realizado</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 100"
                  value={limpezaRealizado}
                  onChange={(e) => setLimpezaRealizado(e.target.value)}
                />
              </div>
              {limpezaMeta && limpezaRealizado && (
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(calcularPercentual(limpezaRealizado, limpezaMeta))}
                    <span className={cn("font-medium", getStatusColor(calcularPercentual(limpezaRealizado, limpezaMeta)))}>
                      {calcularPercentual(limpezaRealizado, limpezaMeta)}%
                    </span>
                  </div>
                  <Progress value={Math.min(calcularPercentual(limpezaRealizado, limpezaMeta), 100)} className="mt-2" />
                </div>
              )}
            </div>

            {/* Tratamento NC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
              <div className="col-span-2">
                <h4 className="font-medium">Tratamento de Não Conformidades</h4>
              </div>
              <div className="space-y-2">
                <Label>Meta</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 100"
                  value={tratamentoNcMeta}
                  onChange={(e) => setTratamentoNcMeta(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Realizado</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 95"
                  value={tratamentoNcRealizado}
                  onChange={(e) => setTratamentoNcRealizado(e.target.value)}
                />
              </div>
              {tratamentoNcMeta && tratamentoNcRealizado && (
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(calcularPercentual(tratamentoNcRealizado, tratamentoNcMeta))}
                    <span className={cn("font-medium", getStatusColor(calcularPercentual(tratamentoNcRealizado, tratamentoNcMeta)))}>
                      {calcularPercentual(tratamentoNcRealizado, tratamentoNcMeta)}%
                    </span>
                  </div>
                  <Progress value={Math.min(calcularPercentual(tratamentoNcRealizado, tratamentoNcMeta), 100)} className="mt-2" />
                </div>
              )}
            </div>

            {/* Operação Segura */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
              <div className="col-span-2">
                <h4 className="font-medium">Operação Segura</h4>
              </div>
              <div className="space-y-2">
                <Label>Meta</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 100"
                  value={operacaoSeguraMeta}
                  onChange={(e) => setOperacaoSeguraMeta(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Realizado</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 100"
                  value={operacaoSeguraRealizado}
                  onChange={(e) => setOperacaoSeguraRealizado(e.target.value)}
                />
              </div>
              {operacaoSeguraMeta && operacaoSeguraRealizado && (
                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(calcularPercentual(operacaoSeguraRealizado, operacaoSeguraMeta))}
                    <span className={cn("font-medium", getStatusColor(calcularPercentual(operacaoSeguraRealizado, operacaoSeguraMeta)))}>
                      {calcularPercentual(operacaoSeguraRealizado, operacaoSeguraMeta)}%
                    </span>
                  </div>
                  <Progress value={Math.min(calcularPercentual(operacaoSeguraRealizado, operacaoSeguraMeta), 100)} className="mt-2" />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              className="gap-2" 
              onClick={handleSave}
              disabled={!setorSelecionado || !competencia}
            >
              <Plus className="h-4 w-4" />
              {editingRecord ? "Atualizar" : "Adicionar"} Indicadores
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Indicadores */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Indicadores por Setor</CardTitle>
          <CardDescription>
            Histórico de indicadores registrados por setor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex items-end gap-4">
            <div className="relative w-[300px]">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar por setor ou período..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Select value={setorFilter} onValueChange={(v) => setSetorFilter(v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os setores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os setores</SelectItem>
                  {setores.filter(s => s.ativo).map(setor => (
                    <SelectItem key={setor.id} value={setor.id}>
                      {setor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabela */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Setor</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead className="text-center">Hora Máq.</TableHead>
                  <TableHead className="text-center">Ident. NC</TableHead>
                  <TableHead className="text-center">Limpeza</TableHead>
                  <TableHead className="text-center">Trat. NC</TableHead>
                  <TableHead className="text-center">Op. Segura</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIndicadores.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      {item.setor?.nome || "Setor não encontrado"}
                    </TableCell>
                    <TableCell>
                      {formatDateToBrazilian(item.competencia)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.hora_maquina_percentual !== null && item.hora_maquina_percentual !== undefined ? (
                        <div className="flex items-center justify-center gap-1">
                          {getStatusIcon(Math.round(item.hora_maquina_percentual * 100))}
                          <span className={cn("text-sm", getStatusColor(Math.round(item.hora_maquina_percentual * 100)))}>
                            {Math.round(item.hora_maquina_percentual * 100)}%
                          </span>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.identificacao_nc_percentual !== null && item.identificacao_nc_percentual !== undefined ? (
                        <div className="flex items-center justify-center gap-1">
                          {getStatusIcon(Math.round(item.identificacao_nc_percentual * 100))}
                          <span className={cn("text-sm", getStatusColor(Math.round(item.identificacao_nc_percentual * 100)))}>
                            {Math.round(item.identificacao_nc_percentual * 100)}%
                          </span>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.limpeza_percentual !== null && item.limpeza_percentual !== undefined ? (
                        <div className="flex items-center justify-center gap-1">
                          {getStatusIcon(Math.round(item.limpeza_percentual * 100))}
                          <span className={cn("text-sm", getStatusColor(Math.round(item.limpeza_percentual * 100)))}>
                            {Math.round(item.limpeza_percentual * 100)}%
                          </span>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.tratamento_nc_percentual !== null && item.tratamento_nc_percentual !== undefined ? (
                        <div className="flex items-center justify-center gap-1">
                          {getStatusIcon(Math.round(item.tratamento_nc_percentual * 100))}
                          <span className={cn("text-sm", getStatusColor(Math.round(item.tratamento_nc_percentual * 100)))}>
                            {Math.round(item.tratamento_nc_percentual * 100)}%
                          </span>
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.operacao_segura_percentual !== null && item.operacao_segura_percentual !== undefined ? (
                        <div className="flex items-center justify-center gap-1">
                          {getStatusIcon(Math.round(item.operacao_segura_percentual * 100))}
                          <span className={cn("text-sm", getStatusColor(Math.round(item.operacao_segura_percentual * 100)))}>
                            {Math.round(item.operacao_segura_percentual * 100)}%
                          </span>
                        </div>
                      ) : "-"}
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
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Indicadores</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir estes indicadores? Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(item.id)}
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

          {/* Footer */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Mostrando {filteredIndicadores.length} de {indicadores.length} registros
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};