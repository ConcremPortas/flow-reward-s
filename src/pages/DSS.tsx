// Página DSS - conectada ao banco de dados
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useDSS } from "@/hooks/useDSS";

export const DSS = () => {
  const { funcionarios, loading } = useFuncionarios();
  const { dssRecords, loading: dssLoading, createDSS } = useDSS();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [tema, setTema] = useState("");
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});

  const handlePresencaChange = (funcionarioId: string, presente: boolean) => {
    setPresencas(prev => ({
      ...prev,
      [funcionarioId]: presente
    }));
  };

  const handleSave = async () => {
    if (!selectedDate || !tema.trim()) {
      alert("Por favor, preencha a data e o tema do DSS");
      return;
    }
    
    const participantesPresentes = Object.keys(presencas).filter(id => presencas[id]);
    
    await createDSS({
      titulo: tema,
      descricao: `DSS realizado sobre: ${tema}`,
      data_realizacao: selectedDate.toISOString().split('T')[0],
      participantes_ids: participantesPresentes,
      topics: [tema],
      observacoes: `${participantesPresentes.length} funcionários presentes`
    });
    
    // Reset form
    setSelectedDate(undefined);
    setTema("");
    setPresencas({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando DSS...</div>
      </div>
    );
  }

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
            
            {funcionarios.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Nome</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead className="text-center">Presente</TableHead>
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
                              className="switch-present"
                              checked={presencas[funcionario.id] || false}
                              onCheckedChange={(checked) => 
                                handlePresencaChange(funcionario.id, checked)
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
                <p className="text-sm">Cadastre funcionários para realizar o DSS.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setSelectedDate(undefined);
              setTema("");
              setPresencas({});
            }}>
              Cancelar
            </Button>
            <Button 
              className="gap-2" 
              onClick={handleSave}
              disabled={!selectedDate || !tema.trim() || funcionarios.length === 0}
            >
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
          {dssLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg">Carregando histórico...</div>
            </div>
          ) : dssRecords.length > 0 ? (
            <div className="space-y-4">
              {dssRecords.map((dss) => (
                <div key={dss.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium">{dss.titulo}</h4>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(dss.data_realizacao), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </div>
                  {dss.descricao && (
                    <p className="text-sm text-muted-foreground mb-2">{dss.descricao}</p>
                  )}
                  <div className="flex gap-4 text-sm">
                    <span>
                      <strong>Participantes:</strong> {dss.participantes_ids?.length || 0}
                    </span>
                    {dss.topics && dss.topics.length > 0 && (
                      <span>
                        <strong>Tópicos:</strong> {dss.topics.join(", ")}
                      </span>
                    )}
                  </div>
                  {dss.observacoes && (
                    <p className="text-sm text-muted-foreground mt-2">{dss.observacoes}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              <p>Nenhum DSS realizado ainda.</p>
              <p className="text-sm">Os DSS realizados aparecerão aqui.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};