// Página EPI - conectada ao banco de dados
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { CalendarIcon, Save, FileText } from "lucide-react";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useEPI } from "@/hooks/useEPI";

export const EPI = () => {
  const { funcionarios, loading } = useFuncionarios();
  const { createEPI } = useEPI();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [statusEPI, setStatusEPI] = useState<Record<string, string>>({});

  const handleStatusChange = (funcionarioId: string, status: string) => {
    setStatusEPI(prev => ({
      ...prev,
      [funcionarioId]: status
    }));
  };

  const handleSave = async () => {
    if (!selectedDate) {
      alert("Por favor, selecione a data da auditoria");
      return;
    }
    
    // Criar registros para cada funcionário auditado
    const funcionariosAuditados = Object.keys(statusEPI);
    
    for (const funcionarioId of funcionariosAuditados) {
      await createEPI({
        funcionario_id: funcionarioId,
        tipo_epi: "Auditoria Geral",
        data_entrega: selectedDate.toISOString().split('T')[0],
        status: statusEPI[funcionarioId],
        descricao: `Auditoria de EPI realizada em ${selectedDate.toLocaleDateString()}`,
        observacoes: `Status: ${statusEPI[funcionarioId] === 'conforme' ? 'Conforme' : 'Não conforme'}`
      });
    }
    
    // Reset form
    setSelectedDate(undefined);
    setStatusEPI({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando EPI...</div>
      </div>
    );
  }

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
            
            {funcionarios.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Nome</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead className="text-center">Conforme</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {funcionarios.filter(f => f.ativo).map((funcionario) => (
                      <TableRow key={funcionario.id}>
                        <TableCell className="font-medium">{funcionario.nome}</TableCell>
                        <TableCell>{funcionario.setor?.nome || "Não informado"}</TableCell>
                        <TableCell>{funcionario.empresa?.nome || "Não informado"}</TableCell>
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
            ) : (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <p>Nenhum funcionário cadastrado ainda.</p>
                <p className="text-sm">Cadastre funcionários para realizar a auditoria de EPI.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setSelectedDate(undefined);
              setStatusEPI({});
            }}>
              Cancelar
            </Button>
            <Button 
              className="gap-2" 
              onClick={handleSave}
              disabled={!selectedDate || funcionarios.length === 0}
            >
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
          <div className="text-center py-8 text-muted-foreground border rounded-lg">
            <p>Nenhuma auditoria de EPI realizada ainda.</p>
            <p className="text-sm">As auditorias realizadas aparecerão aqui.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};