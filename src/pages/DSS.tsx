import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Plus, CalendarIcon, Save, FileText } from "lucide-react";

// Dados de exemplo
const funcionariosAtivos = [
  { id: 1, codigo: "FN001", nome: "João Silva Santos", setor: "Produção" },
  { id: 2, codigo: "FN002", nome: "Maria Santos Oliveira", setor: "Qualidade" },
  { id: 3, codigo: "FN004", nome: "Ana Paula Costa", setor: "Expedição" },
  { id: 4, codigo: "FN006", nome: "Pedro Alves Lima", setor: "Montagem" },
  { id: 5, codigo: "FN007", nome: "Carla Mendes Silva", setor: "Produção" },
];

const dssRealizados = [
  {
    id: 1,
    data: new Date(2024, 0, 15),
    tema: "Uso correto de EPIs",
    participantes: 4,
    totalFuncionarios: 5
  },
  {
    id: 2,
    data: new Date(2024, 0, 8),
    tema: "Prevenção de acidentes na operação de máquinas",
    participantes: 5,
    totalFuncionarios: 5
  },
  {
    id: 3,
    data: new Date(2024, 0, 1),
    tema: "Ordem e limpeza no ambiente de trabalho",
    participantes: 3,
    totalFuncionarios: 5
  }
];

export const DSS = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [tema, setTema] = useState("");
  const [presencas, setPresencas] = useState<Record<number, boolean>>({});

  const handlePresencaChange = (funcionarioId: number, presente: boolean) => {
    setPresencas(prev => ({
      ...prev,
      [funcionarioId]: presente
    }));
  };

  const calcularParticipacao = (participantes: number, total: number) => {
    return Math.round((participantes / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Novo DSS */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Novo DSS - Diálogo Semanal de Segurança</CardTitle>
          <CardDescription>
            Registre a realização de um novo diálogo semanal de segurança
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de Realização</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tema do DSS</label>
              <Input
                placeholder="Ex: Uso correto de EPIs"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
              />
            </div>
          </div>

          {/* Lista de presença */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Lista de Presença</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead className="text-center">Presente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funcionariosAtivos.map((funcionario) => (
                    <TableRow key={funcionario.id}>
                      <TableCell className="font-medium">{funcionario.codigo}</TableCell>
                      <TableCell>{funcionario.nome}</TableCell>
                      <TableCell>{funcionario.setor}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={presencas[funcionario.id] || false}
                          onCheckedChange={(checked) => 
                            handlePresencaChange(funcionario.id, checked as boolean)
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline">Cancelar</Button>
            <Button className="gap-2">
              <Save className="h-4 w-4" />
              Salvar DSS
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de DSS */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Histórico de DSS</CardTitle>
              <CardDescription>
                DSS realizados anteriormente
              </CardDescription>
            </div>
            <Button variant="outline" className="gap-2">
              <FileText className="h-4 w-4" />
              Relatório
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Data</TableHead>
                  <TableHead>Tema</TableHead>
                  <TableHead>Participantes</TableHead>
                  <TableHead>% Participação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dssRealizados.map((dss) => (
                  <TableRow key={dss.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell>{format(dss.data, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>{dss.tema}</TableCell>
                    <TableCell>{dss.participantes}/{dss.totalFuncionarios}</TableCell>
                    <TableCell>
                      <span className={cn(
                        "font-medium",
                        calcularParticipacao(dss.participantes, dss.totalFuncionarios) >= 80 
                          ? "text-success" 
                          : "text-destructive"
                      )}>
                        {calcularParticipacao(dss.participantes, dss.totalFuncionarios)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Ver Detalhes
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};