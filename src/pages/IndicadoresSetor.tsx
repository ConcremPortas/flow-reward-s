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

const indicadoresSetor = [
  {
    id: 1,
    setor: "Produção",
    mesReferencia: "01/2024",
    meta: 95,
    realizado: 98,
    percentual: 103
  },
  {
    id: 2,
    setor: "Qualidade",
    mesReferencia: "01/2024",
    meta: 99,
    realizado: 97,
    percentual: 98
  },
  {
    id: 3,
    setor: "Montagem",
    mesReferencia: "01/2024",
    meta: 90,
    realizado: 94,
    percentual: 104
  },
  {
    id: 4,
    setor: "Expedição",
    mesReferencia: "01/2024",
    meta: 85,
    realizado: 82,
    percentual: 96
  }
];

export const IndicadoresSetor = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [setorSelecionado, setSetorSelecionado] = useState("");
  const [mesReferencia, setMesReferencia] = useState("");
  const [meta, setMeta] = useState("");
  const [realizado, setRealizado] = useState("");

  const filteredIndicadores = indicadoresSetor.filter(item =>
    item.setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.mesReferencia.includes(searchTerm)
  );

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

  return (
    <div className="space-y-6">
      {/* Novo Registro */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Registrar Indicador por Setor</CardTitle>
          <CardDescription>
            Registre metas e realizações de indicadores específicos por setor
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
              <label className="text-sm font-medium">Mês de Referência</label>
              <Input
                type="month"
                value={mesReferencia}
                onChange={(e) => setMesReferencia(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Meta (%)</label>
              <Input
                type="number"
                placeholder="Ex: 95"
                min="0"
                max="100"
                value={meta}
                onChange={(e) => setMeta(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Realizado (%)</label>
              <Input
                type="number"
                placeholder="Ex: 98"
                min="0"
                max="100"
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
            <Button variant="outline">Cancelar</Button>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Registro
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
                  <TableHead>Período</TableHead>
                  <TableHead className="text-center">Meta (%)</TableHead>
                  <TableHead className="text-center">Realizado (%)</TableHead>
                  <TableHead>Atingimento</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIndicadores.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{item.setor}</TableCell>
                    <TableCell>{item.mesReferencia}</TableCell>
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

          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
            {indicadoresSetor.map((item) => (
              <Card key={item.id} className="card-elegant">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{item.setor}</h4>
                    {getStatusIcon(item.percentual)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Meta:</span>
                      <span>{item.meta}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Realizado:</span>
                      <span className={getStatusColor(item.percentual)}>{item.realizado}%</span>
                    </div>
                    <Progress value={Math.min(item.percentual, 100)} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};