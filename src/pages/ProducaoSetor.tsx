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
import { Plus, Search, Edit, TrendingUp, TrendingDown, Minus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSetores } from "@/hooks/useSetores";
import { useProducaoSetor } from "@/hooks/useProducaoSetor";
import { formatDateToBrasilia, formatDateToBrazilian, formatDateToInput } from "@/lib/dateUtils";

export const ProducaoSetor = () => {
  const { setores, loading: setoresLoading } = useSetores();
  const { registros, loading: registrosLoading, createRegistro, updateRegistro, deleteRegistro } = useProducaoSetor();
  const [searchTerm, setSearchTerm] = useState("");
  const [competenciaFilter, setCompetenciaFilter] = useState("all");
  const [setorFilter, setSetorFilter] = useState("");
  const [setorSelecionado, setSetorSelecionado] = useState("");
  const [dataProducao, setDataProducao] = useState("");
  const [metaDiaria, setMetaDiaria] = useState("");
  const [producaoRealizada, setProducaoRealizada] = useState("");
  const [unidadeMedida, setUnidadeMedida] = useState("unidades");
  const [observacoes, setObservacoes] = useState("");
  const [editingRecord, setEditingRecord] = useState<string | null>(null);

  // Obter competências únicas dos registros
  const competenciasDisponiveis = Array.from(
    new Set(
      registros.map(item => {
        if (!item.data_producao) return '';
        const date = new Date(item.data_producao);
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      }).filter(Boolean)
    )
  ).sort((a, b) => {
    const [monthA, yearA] = a.split('/').map(Number);
    const [monthB, yearB] = b.split('/').map(Number);
    return yearB - yearA || monthB - monthA;
  });

  const filteredRegistros = registros
    .filter(item => item.unidade_medida !== "percentual") // Excluir indicadores (que usam percentual)
    .filter(item => {
      const monthYear = item.data_producao ? (() => {
        const date = new Date(item.data_producao);
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      })() : '';
      
      const matchesSearch = item.setor?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           monthYear.includes(searchTerm);
      
      const matchesCompetencia = !competenciaFilter || competenciaFilter === "all" || monthYear === competenciaFilter;
      
      const matchesSetor = !setorFilter || setorFilter === "all" || item.setor_id === setorFilter;
      
      return matchesSearch && matchesCompetencia && matchesSetor;
    });

  const calcularPercentual = (realizado: number, meta: number) => {
    return Math.round((realizado / meta) * 100);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const getStatusIcon = (percentual: number) => {
    if (percentual >= 100) return <TrendingUp className="h-4 w-4 text-success" />;
    if (percentual >= 90) return <Minus className="h-4 w-4 text-status-warning" />;
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  const getStatusColor = (percentual: number) => {
    if (percentual >= 100) return "text-success";
    if (percentual >= 90) return "text-status-warning";
    return "text-destructive";
  };

  const handleSave = async () => {
    if (!setorSelecionado || !dataProducao || !metaDiaria || !producaoRealizada) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    // Ajustar data para fuso horário de Brasília
    const dataFormatada = formatDateToBrasilia(dataProducao);

    const registro = {
      setor_id: setorSelecionado,
      data_producao: dataFormatada,
      meta_diaria: parseFloat(metaDiaria),
      producao_realizada: parseFloat(producaoRealizada),
      unidade_medida: unidadeMedida,
      observacoes: observacoes || undefined
    };

    if (editingRecord) {
      await updateRegistro(editingRecord, registro);
    } else {
      await createRegistro(registro);
    }

    // Reset form
    setSetorSelecionado("");
    setDataProducao("");
    setMetaDiaria("");
    setProducaoRealizada("");
    setUnidadeMedida("unidades");
    setObservacoes("");
    setEditingRecord(null);
  };

  const handleEdit = (registro: any) => {
    setSetorSelecionado(registro.setor_id);
    setDataProducao(formatDateToInput(registro.data_producao));
    setMetaDiaria(registro.meta_diaria.toString());
    setProducaoRealizada(registro.producao_realizada.toString());
    setUnidadeMedida(registro.unidade_medida);
    setObservacoes(registro.observacoes || "");
    setEditingRecord(registro.id);
  };

  const handleDelete = async (id: string) => {
    await deleteRegistro(id);
  };

  const handleCancel = () => {
    setSetorSelecionado("");
    setDataProducao("");
    setMetaDiaria("");
    setProducaoRealizada("");
    setUnidadeMedida("unidades");
    setObservacoes("");
    setEditingRecord(null);
  };

  if (setoresLoading || registrosLoading) {
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
          <CardTitle>{editingRecord ? "Editar" : "Registrar"} Produção por Setor</CardTitle>
          <CardDescription>
            {editingRecord ? "Edite o registro selecionado" : "Registre a meta e produção realizada por setor"}
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
                type="month"
                value={dataProducao}
                onChange={(e) => setDataProducao(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Unidade de Medida</label>
              <Select value={unidadeMedida} onValueChange={setUnidadeMedida}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unidades">Unidades</SelectItem>
                  <SelectItem value="pecas">Peças</SelectItem>
                  <SelectItem value="kg">Quilogramas</SelectItem>
                  <SelectItem value="toneladas">Toneladas</SelectItem>
                  <SelectItem value="metros">Metros</SelectItem>
                  <SelectItem value="litros">Litros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Meta Diária *</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 1000"
                value={metaDiaria}
                onChange={(e) => setMetaDiaria(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Produção Realizada *</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 1050"
                value={producaoRealizada}
                onChange={(e) => setProducaoRealizada(e.target.value)}
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
          {metaDiaria && producaoRealizada && (
            <div className="p-4 bg-accent/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Percentual Realizado:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(calcularPercentual(Number(producaoRealizada), Number(metaDiaria)))}
                  <span className={cn(
                    "text-lg font-bold",
                    getStatusColor(calcularPercentual(Number(producaoRealizada), Number(metaDiaria)))
                  )}>
                    {calcularPercentual(Number(producaoRealizada), Number(metaDiaria))}%
                  </span>
                </div>
              </div>
              <Progress 
                value={Math.min(calcularPercentual(Number(producaoRealizada), Number(metaDiaria)), 100)} 
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
              disabled={!setorSelecionado || !dataProducao || !metaDiaria || !producaoRealizada}
            >
              <Plus className="h-4 w-4" />
              {editingRecord ? "Atualizar" : "Adicionar"} Registro
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dados de Produção */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Produção por Setor</CardTitle>
              <CardDescription>
                Histórico de metas e realizações por setor
              </CardDescription>
            </div>
          </div>
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
            
            <div className="flex-1 min-w-[200px]">
              <Select value={competenciaFilter} onValueChange={setCompetenciaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as competências" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as competências</SelectItem>
                  {competenciasDisponiveis.map((competencia) => (
                    <SelectItem key={competencia} value={competencia}>
                      {competencia}
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
                  <TableHead className="text-right">Meta</TableHead>
                  <TableHead className="text-right">Realizado</TableHead>
                  <TableHead>Percentual</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistros.map((item) => {
                  const percentual = calcularPercentual(item.producao_realizada, item.meta_diaria);
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
                        {formatDateToBrazilian(item.data_producao)}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(item.meta_diaria)}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.producao_realizada)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(percentual)}
                          <span className={cn("font-medium", getStatusColor(percentual))}>
                            {percentual}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress 
                            value={Math.min(percentual, 100)} 
                            className="h-2"
                          />
                          <div className="text-xs text-muted-foreground">
                            {percentual >= 100 ? "Meta superada" : 
                             percentual >= 90 ? "Próximo da meta" : 
                             "Abaixo da meta"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.unidade_medida}
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
                                <AlertDialogTitle>Excluir Registro</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
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
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Resumo */}
          {registros.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-2xl font-bold text-success">
                  {registros.filter(r => calcularPercentual(r.producao_realizada, r.meta_diaria) >= 100).length}
                </div>
                <div className="text-sm text-muted-foreground">Registros acima da meta</div>
              </div>
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-2xl font-bold text-status-warning">
                  {registros.filter(r => {
                    const perc = calcularPercentual(r.producao_realizada, r.meta_diaria);
                    return perc >= 90 && perc < 100;
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Registros próximos da meta</div>
              </div>
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-2xl font-bold text-destructive">
                  {registros.filter(r => calcularPercentual(r.producao_realizada, r.meta_diaria) < 90).length}
                </div>
                <div className="text-sm text-muted-foreground">Registros abaixo da meta</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};