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
import { Plus, Search, Edit, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

// Dados de exemplo
const setores = ["Produção", "Qualidade", "Montagem", "Expedição"];

const producaoSetor = [
  {
    id: 1,
    setor: "Produção",
    mesAno: "01/2024",
    meta: 1000,
    realizado: 1050,
    percentual: 105
  },
  {
    id: 2,
    setor: "Qualidade",
    mesAno: "01/2024",
    meta: 800,
    realizado: 760,
    percentual: 95
  },
  {
    id: 3,
    setor: "Montagem",
    mesAno: "01/2024",
    meta: 600,
    realizado: 630,
    percentual: 105
  },
  {
    id: 4,
    setor: "Expedição",
    mesAno: "01/2024",
    meta: 400,
    realizado: 380,
    percentual: 95
  },
  {
    id: 5,
    setor: "Produção",
    mesAno: "12/2023",
    meta: 950,
    realizado: 920,
    percentual: 97
  }
];

export const ProducaoSetor = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [setorSelecionado, setSetorSelecionado] = useState("");
  const [mesAno, setMesAno] = useState("");
  const [meta, setMeta] = useState("");
  const [realizado, setRealizado] = useState("");

  const filteredProducao = producaoSetor.filter(item =>
    item.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.mesAno.includes(searchTerm)
  );

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

  const getProgressColor = (percentual: number) => {
    if (percentual >= 100) return "bg-success";
    if (percentual >= 90) return "bg-status-warning";
    return "bg-destructive";
  };

  return (
    <div className="space-y-6">
      {/* Novo Registro */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Registrar Produção por Setor</CardTitle>
          <CardDescription>
            Registre a meta e produção realizada por setor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Setor</label>
              <Select value={setorSelecionado} onValueChange={setSetorSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {setores.map(setor => (
                    <SelectItem key={setor} value={setor}>{setor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mês/Ano</label>
              <Input
                type="month"
                value={mesAno}
                onChange={(e) => setMesAno(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Meta</label>
              <Input
                type="number"
                placeholder="Ex: 1000"
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Realizado</label>
              <Input
                type="number"
                placeholder="Ex: 1050"
                value={realizado}
                onChange={(e) => setRealizado(e.target.value)}
              />
            </div>
          </div>

          {/* Prévia do cálculo */}
          {meta && realizado && (
            <div className="p-4 bg-accent/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Percentual Realizado:</span>
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
            <Button variant="outline">Cancelar</Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Registro
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
                  <TableHead>Período</TableHead>
                  <TableHead className="text-right">Meta</TableHead>
                  <TableHead className="text-right">Realizado</TableHead>
                  <TableHead>Percentual</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducao.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{item.setor}</TableCell>
                    <TableCell>{item.mesAno}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.meta)}</TableCell>
                    <TableCell className="text-right">{formatNumber(item.realizado)}</TableCell>
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
                           item.percentual >= 90 ? "Próximo da meta" : 
                           "Abaixo da meta"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Edit className="h-3 w-3" />
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center p-4 bg-accent/50 rounded-lg">
              <div className="text-2xl font-bold text-success">2</div>
              <div className="text-sm text-muted-foreground">Setores acima da meta</div>
            </div>
            <div className="text-center p-4 bg-accent/50 rounded-lg">
              <div className="text-2xl font-bold text-status-warning">0</div>
              <div className="text-sm text-muted-foreground">Setores próximos da meta</div>
            </div>
            <div className="text-center p-4 bg-accent/50 rounded-lg">
              <div className="text-2xl font-bold text-destructive">2</div>
              <div className="text-sm text-muted-foreground">Setores abaixo da meta</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};