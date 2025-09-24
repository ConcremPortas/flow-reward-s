import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { StatusBadge } from "@/components/ui/status-badge";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Save, FileText, AlertTriangle } from "lucide-react";

// Dados de exemplo
const funcionariosAtivos = [
  { id: 1, codigo: "FN001", nome: "João Silva Santos", setor: "Produção" },
  { id: 2, codigo: "FN002", nome: "Maria Santos Oliveira", setor: "Qualidade" },
  { id: 3, codigo: "FN004", nome: "Ana Paula Costa", setor: "Expedição" },
  { id: 4, codigo: "FN006", nome: "Pedro Alves Lima", setor: "Montagem" },
  { id: 5, codigo: "FN007", nome: "Carla Mendes Silva", setor: "Produção" },
];

const auditorias = [
  {
    id: 1,
    data: new Date(2024, 0, 20),
    conformes: 4,
    naoConformes: 1,
    total: 5,
    detalhes: [
      { funcionarioId: 1, status: "conforme" },
      { funcionarioId: 2, status: "conforme" },
      { funcionarioId: 3, status: "nao_conforme" },
      { funcionarioId: 4, status: "conforme" },
      { funcionarioId: 5, status: "conforme" },
    ]
  },
  {
    id: 2,
    data: new Date(2024, 0, 13),
    conformes: 5,
    naoConformes: 0,
    total: 5,
    detalhes: []
  },
  {
    id: 3,
    data: new Date(2024, 0, 6),
    conformes: 3,
    naoConformes: 2,
    total: 5,
    detalhes: []
  }
];

export const EPI = () => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [statusEPI, setStatusEPI] = useState<Record<number, string>>({});

  const handleStatusChange = (funcionarioId: number, status: string) => {
    setStatusEPI(prev => ({
      ...prev,
      [funcionarioId]: status
    }));
  };

  const calcularConformidade = (conformes: number, total: number) => {
    return Math.round((conformes / total) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Nova Auditoria EPI */}
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Nova Auditoria de EPI</CardTitle>
          <CardDescription>
            Registre uma nova auditoria de equipamentos de proteção individual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data da Auditoria</label>
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
          </div>

          {/* Lista de auditoria */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Status dos EPIs por Funcionário</h3>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead className="text-center">Conforme</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {funcionariosAtivos.map((funcionario) => (
                    <TableRow key={funcionario.id}>
                      <TableCell className="font-medium">{funcionario.codigo}</TableCell>
                      <TableCell>{funcionario.nome}</TableCell>
                      <TableCell>{funcionario.setor}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center">
                          <Switch
                            className="switch-conforme"
                            checked={statusEPI[funcionario.id] === "conforme"}
                            onCheckedChange={(checked) => 
                              handleStatusChange(funcionario.id, checked ? "conforme" : "nao_conforme")
                            }
                          />
                        </div>
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
              Salvar Auditoria
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Auditorias */}
      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Histórico de Auditorias</CardTitle>
              <CardDescription>
                Auditorias de EPI realizadas
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
                  <TableHead>Conformes</TableHead>
                  <TableHead>Não Conformes</TableHead>
                  <TableHead>% Conformidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditorias.map((auditoria) => {
                  const conformidade = calcularConformidade(auditoria.conformes, auditoria.total);
                  return (
                    <TableRow key={auditoria.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>{format(auditoria.data, "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell className="text-success font-medium">{auditoria.conformes}</TableCell>
                      <TableCell className="text-destructive font-medium">{auditoria.naoConformes}</TableCell>
                      <TableCell>
                        <span className={cn(
                          "font-medium",
                          conformidade >= 90 ? "text-success" : 
                          conformidade >= 70 ? "text-status-warning" : "text-destructive"
                        )}>
                          {conformidade}%
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge 
                          status={auditoria.naoConformes > 0 ? "warning" : "active"}
                        >
                          {auditoria.naoConformes > 0 ? (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Pendências
                            </div>
                          ) : (
                            "Conforme"
                          )}
                        </StatusBadge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Ver Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};