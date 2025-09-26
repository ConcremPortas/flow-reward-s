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
import { Plus, Search, Edit, TrendingUp, TrendingDown, Minus, Award, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

const tiposIndicador = ["Produtividade", "Qualidade", "Segurança", "Eficiência", "Logística"];

const indicadoresGeraisInitial = [
  {
    id: 1,
    nome: "Produtividade Geral",
    tipo: "Produtividade",
    competencia: "2025-01-01",
    meta: 95,
    realizado: 98,
    percentual: 103,
    impactoPremiacao: "Alto"
  },
  {
    id: 2,
    nome: "Índice de Qualidade",
    tipo: "Qualidade",
    competencia: "2025-01-01",
    meta: 99,
    realizado: 97,
    percentual: 98,
    impactoPremiacao: "Alto"
  },
  {
    id: 3,
    nome: "Indicador de Segurança",
    tipo: "Segurança",
    competencia: "2025-01-01",
    meta: 100,
    realizado: 100,
    percentual: 100,
    impactoPremiacao: "Médio"
  },
  {
    id: 4,
    nome: "Eficiência Operacional",
    tipo: "Eficiência",
    competencia: "2025-01-01",
    meta: 85,
    realizado: 89,
    percentual: 105,
    impactoPremiacao: "Médio"
  },
  {
    id: 5,
    nome: "Performance Logística",
    tipo: "Logística",
    competencia: "2025-01-01",
    meta: 90,
    realizado: 87,
    percentual: 97,
    impactoPremiacao: "Baixo"
  }
];

export const IndicadoresGerais = () => {
  const [indicadoresGerais, setIndicadoresGerais] = useState(indicadoresGeraisInitial);
  const [searchTerm, setSearchTerm] = useState("");
  const [nomeIndicador, setNomeIndicador] = useState("");
  const [tipoSelecionado, setTipoSelecionado] = useState("");
  const [competencia, setCompetencia] = useState("");
  const [meta, setMeta] = useState("");
  const [realizado, setRealizado] = useState("");
  const [impactoPremiacao, setImpactoPremiacao] = useState("");
  const [editingRecord, setEditingRecord] = useState<number | null>(null);

  const filteredIndicadores = indicadoresGerais.filter(item => {
    const monthYear = item.competencia ? `${item.competencia.slice(5,7)}/${item.competencia.slice(0,4)}` : '';
    return (
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const getImpactoColor = (impacto: string) => {
    switch (impacto) {
      case "Alto": return "text-primary font-medium";
      case "Médio": return "text-status-warning";
      case "Baixo": return "text-muted-foreground";
      default: return "text-foreground";
    }
  };

  const getImpactoIcon = (impacto: string) => {
    if (impacto === "Alto") return <Award className="h-3 w-3" />;
    return null;
  };

  const handleSave = () => {
    if (!nomeIndicador || !tipoSelecionado || !competencia || !meta || !realizado || !impactoPremiacao) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    const percentual = calcularPercentual(Number(realizado), Number(meta));
    
    if (editingRecord) {
      // Atualizar registro existente
      setIndicadoresGerais(prev => prev.map(item => 
        item.id === editingRecord 
          ? {
              ...item,
              nome: nomeIndicador,
              tipo: tipoSelecionado,
              competencia,
              meta: Number(meta),
              realizado: Number(realizado),
              percentual,
              impactoPremiacao
            }
          : item
      ));
    } else {
      // Criar novo registro
      const novoIndicador = {
        id: Math.max(...indicadoresGerais.map(i => i.id)) + 1,
        nome: nomeIndicador,
        tipo: tipoSelecionado,
        competencia,
        meta: Number(meta),
        realizado: Number(realizado),
        percentual,
        impactoPremiacao
      };
      setIndicadoresGerais(prev => [...prev, novoIndicador]);
    }

    // Reset form
    handleCancel();
  };

  const handleEdit = (indicador: any) => {
    setNomeIndicador(indicador.nome);
    setTipoSelecionado(indicador.tipo);
    setCompetencia(indicador.competencia);
    setMeta(indicador.meta.toString());
    setRealizado(indicador.realizado.toString());
    setImpactoPremiacao(indicador.impactoPremiacao);
    setEditingRecord(indicador.id);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este indicador?")) {
      setIndicadoresGerais(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleCancel = () => {
    setNomeIndicador("");
    setTipoSelecionado("");
    setCompetencia("");
    setMeta("");
    setRealizado("");
    setImpactoPremiacao("");
    setEditingRecord(null);
  };

  return (
    <div className="space-y-6">
      {/* Novo Indicador */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>{editingRecord ? "Editar" : "Registrar"} Indicador Geral</CardTitle>
          <CardDescription>
            {editingRecord ? "Edite o indicador selecionado" : "Registre indicadores gerais que impactam na premiação dos funcionários"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome do Indicador *</label>
              <Input
                placeholder="Ex: Produtividade Geral"
                value={nomeIndicador}
                onChange={(e) => setNomeIndicador(e.target.value)}
              />
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
              <label className="text-sm font-medium">Tipo *</label>
              <Select value={tipoSelecionado} onValueChange={setTipoSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposIndicador.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Meta *</label>
              <Input
                type="number"
                placeholder="Ex: 95"
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Realizado *</label>
              <Input
                type="number"
                placeholder="Ex: 98"
                value={realizado}
                onChange={(e) => setRealizado(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Impacto Premiação *</label>
              <Select value={impactoPremiacao} onValueChange={setImpactoPremiacao}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o impacto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alto">Alto</SelectItem>
                  <SelectItem value="Médio">Médio</SelectItem>
                  <SelectItem value="Baixo">Baixo</SelectItem>
                </SelectContent>
              </Select>
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
              disabled={!nomeIndicador || !tipoSelecionado || !competencia || !meta || !realizado || !impactoPremiacao}
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
                Indicadores que impactam na premiação geral dos funcionários
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
                placeholder="Buscar indicadores, tipo ou período..."
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
                  <TableHead>Nome do Indicador</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead className="text-center">Meta</TableHead>
                  <TableHead className="text-center">Realizado</TableHead>
                  <TableHead>Atingimento</TableHead>
                  <TableHead>Impacto Premiação</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIndicadores.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell>{item.tipo}</TableCell>
                    <TableCell>
                      {item.competencia ? new Date(item.competencia).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' }) : '-'}
                    </TableCell>
                    <TableCell className="text-center">{item.meta}%</TableCell>
                    <TableCell className="text-center">{item.realizado}%</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.percentual)}
                        <span className={cn("font-medium", getStatusColor(item.percentual))}>
                          {item.percentual}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getImpactoIcon(item.impactoPremiacao)}
                        <span className={getImpactoColor(item.impactoPremiacao)}>
                          {item.impactoPremiacao}
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
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Resumo por Tipo */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-4 border-t">
            {tiposIndicador.map((tipo) => {
              const indicadoresTipo = indicadoresGerais.filter(ind => ind.tipo === tipo);
              const mediaAtingimento = indicadoresTipo.length > 0 
                ? Math.round(indicadoresTipo.reduce((acc, ind) => acc + ind.percentual, 0) / indicadoresTipo.length)
                : 0;
              
              return (
                <Card key={tipo} className="card-elegant">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{tipo}</h4>
                      {mediaAtingimento >= 100 && <Award className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="space-y-2">
                      <div className="text-lg font-bold text-primary">{mediaAtingimento}%</div>
                      <div className="text-xs text-muted-foreground">
                        {indicadoresTipo.length} indicador(es)
                      </div>
                      <Progress value={Math.min(mediaAtingimento, 100)} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};