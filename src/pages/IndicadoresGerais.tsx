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
import { Plus, Search, Edit, TrendingUp, TrendingDown, Minus, Trash2, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTiposIndicadoresGerais } from "@/hooks/useTiposIndicadoresGerais";
import { useIndicadoresGerais } from "@/hooks/useIndicadoresGerais";
import { formatDateToBrasilia, formatDateToBrazilian, formatDateToInput } from "@/lib/dateUtils";

export const IndicadoresGerais = () => {
  const { tiposIndicadores, loading: tiposLoading } = useTiposIndicadoresGerais();
  const { indicadores, loading: indicadoresLoading, createIndicador, updateIndicador, deleteIndicador } = useIndicadoresGerais();
  const [searchTerm, setSearchTerm] = useState("");
  const [tipoIndicadorSelecionado, setTipoIndicadorSelecionado] = useState("");
  const [competencia, setCompetencia] = useState("");
  const [meta, setMeta] = useState("");
  const [realizado, setRealizado] = useState("");
  const [editingRecord, setEditingRecord] = useState<string | null>(null);

  const filteredIndicadores = indicadores.filter(item => {
    const monthYear = item.competencia ? `${item.competencia.slice(5,7)}/${item.competencia.slice(0,4)}` : '';
    return (
      item.tipo_indicador?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tipo_indicador?.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      monthYear.includes(searchTerm)
    );
  });

  const calcularPercentual = (realizado: number, meta: number) => {
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
    if (!tipoIndicadorSelecionado || !competencia || !meta || !realizado) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const dataFormatada = formatDateToBrasilia(competencia);
    
    const data = {
      tipo_indicador_id: tipoIndicadorSelecionado,
      competencia: dataFormatada,
      meta: parseFloat(meta),
      realizado: parseFloat(realizado)
    };

    if (editingRecord) {
      await updateIndicador(editingRecord, data);
    } else {
      await createIndicador(data);
    }

    handleCancel();
  };

  const handleEdit = (indicador: any) => {
    setTipoIndicadorSelecionado(indicador.tipo_indicador_id);
    setCompetencia(formatDateToInput(indicador.competencia).slice(0, 7));
    setMeta(indicador.meta.toString());
    setRealizado(indicador.realizado.toString());
    setEditingRecord(indicador.id);
  };

  const handleDelete = async (id: string) => {
    await deleteIndicador(id);
  };

  const handleCancel = () => {
    setTipoIndicadorSelecionado("");
    setCompetencia("");
    setMeta("");
    setRealizado("");
    setEditingRecord(null);
  };

  if (tiposLoading || indicadoresLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulário */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            {editingRecord ? "Editar" : "Registrar"} Indicador Geral
          </CardTitle>
          <CardDescription>
            {editingRecord ? "Edite o indicador selecionado" : "Registre indicadores gerais com suas metas e realizações"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Indicador Geral *</label>
              <Select value={tipoIndicadorSelecionado} onValueChange={setTipoIndicadorSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o indicador" />
                </SelectTrigger>
                <SelectContent>
                  {tiposIndicadores.filter(t => t.ativo).map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id}>
                      {tipo.nome} ({tipo.codigo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Competência *</label>
              <Input
                type="month"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Meta *</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 1000000"
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Realizado *</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 1050000"
                value={realizado}
                onChange={(e) => setRealizado(e.target.value)}
              />
            </div>
          </div>

          {/* Prévia do cálculo */}
          {meta && realizado && (
            <div className="p-4 bg-accent/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Atingimento da Meta:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(calcularPercentual(Number(realizado), Number(meta)))}
                  <span className={cn(
                    "text-lg font-bold",
                    getStatusColor(calcularPercentual(Number(realizado), Number(meta)))
                  )}>
                    {calcularPercentual(Number(realizado), Number(meta))}%
                  </span>
                </div>
              </div>
              <Progress 
                value={Math.min(calcularPercentual(Number(realizado), Number(meta)), 100)} 
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
              disabled={!tipoIndicadorSelecionado || !competencia || !meta || !realizado}
            >
              <Plus className="h-4 w-4" />
              {editingRecord ? "Atualizar" : "Adicionar"} Indicador
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Indicadores */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Indicadores Gerais</CardTitle>
              <CardDescription>
                Acompanhe a performance dos indicadores gerais da empresa
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
                placeholder="Buscar por indicador ou período..."
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
                  <TableHead>Indicador</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead className="text-center">Meta</TableHead>
                  <TableHead className="text-center">Realizado</TableHead>
                  <TableHead>Atingimento</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIndicadores.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      <div>
                        <span>{item.tipo_indicador?.nome}</span>
                        <div className="text-xs text-muted-foreground">
                          {item.tipo_indicador?.codigo}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDateToBrazilian(item.competencia)}
                    </TableCell>
                    <TableCell className="text-center">
                      {new Intl.NumberFormat('pt-BR').format(item.meta)}
                    </TableCell>
                    <TableCell className="text-center">
                      {new Intl.NumberFormat('pt-BR').format(item.realizado)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.percentual)}
                        <span className={cn("font-medium", getStatusColor(item.percentual))}>
                          {item.percentual}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <Progress 
                          value={Math.min(item.percentual, 100)} 
                          className="h-2"
                        />
                        <div className="text-xs text-muted-foreground">
                          {item.percentual >= 100 ? "Meta superada" : 
                           item.percentual >= 95 ? "Próximo da meta" : 
                           "Abaixo da meta"}
                        </div>
                      </div>
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
                              <AlertDialogTitle>Excluir Indicador</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir este indicador? Esta ação não pode ser desfeita.
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

          {/* Resumo por Tipo */}
          {tiposIndicadores.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
              {tiposIndicadores.filter(t => t.ativo).map((tipo) => {
                const indicadoresTipo = indicadores.filter(ind => ind.tipo_indicador_id === tipo.id);
                const ultimoIndicador = indicadoresTipo[0]; // Já vem ordenado por data desc
                
                return (
                  <Card key={tipo.id} className="card-elegant">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-sm">{tipo.nome}</h4>
                        {ultimoIndicador && getStatusIcon(ultimoIndicador.percentual)}
                      </div>
                      <div className="space-y-2">
                        {ultimoIndicador ? (
                          <>
                            <div className="text-lg font-bold text-primary">
                              {ultimoIndicador.percentual}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDateToBrazilian(ultimoIndicador.competencia)}
                            </div>
                            <Progress value={Math.min(ultimoIndicador.percentual, 100)} className="h-2" />
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Nenhum registro encontrado
                          </div>
                        )}
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
