// Página DSS - conectada ao banco de dados
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Save, FileText, Edit, Trash2 } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useDSS } from "@/hooks/useDSS";
import { useLocaisDSS } from "@/hooks/useLocaisDSS";

export const DSS = () => {
  const { funcionarios, loading } = useFuncionarios();
  const { dssRecords, loading: dssLoading, createDSS, updateDSS, deleteDSS } = useDSS();
  const { locais: locaisDSS } = useLocaisDSS();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [tema, setTema] = useState("");
  const [localDssId, setLocalDssId] = useState<string>("");
  const [presencas, setPresencas] = useState<Record<string, boolean>>({});
  const [observacoes, setObservacoes] = useState("");
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>(null);

  // Filtrar funcionários pelo local DSS selecionado
  const funcionariosFiltrados = localDssId
    ? funcionarios.filter(f => f.local_dss_id === localDssId)
    : [];

  // Marcar todos como presentes por padrão quando o local for selecionado
  useEffect(() => {
    if (localDssId && funcionariosFiltrados.length > 0 && !editingRecord) {
      const todasPresencas: Record<string, boolean> = {};
      funcionariosFiltrados.forEach(funcionario => {
        todasPresencas[funcionario.id] = true;
      });
      setPresencas(todasPresencas);
    }
  }, [localDssId, funcionariosFiltrados.length, editingRecord]);

  const handlePresencaChange = (funcionarioId: string, presente: boolean) => {
    setPresencas(prev => ({
      ...prev,
      [funcionarioId]: presente
    }));
  };

  const handleSave = async () => {
    if (!selectedDate || !tema.trim() || !localDssId) {
      alert("Por favor, preencha a data, local e tema do DSS");
      return;
    }
    
    const participantesPresentes = Object.keys(presencas).filter(id => presencas[id]);
    
    await createDSS({
      titulo: tema,
      descricao: `DSS realizado sobre: ${tema}`,
      data_realizacao: selectedDate.toISOString().split('T')[0],
      local_dss_id: localDssId,
      participantes_ids: participantesPresentes,
      topics: [tema],
      observacoes: `${participantesPresentes.length} funcionários presentes`
    });
    
    // Reset form
    setSelectedDate(undefined);
    setTema("");
    setLocalDssId("");
    setPresencas({});
    setObservacoes("");
    setEditingRecord(null);
    setEditingData(null);
  };

  const handleEdit = (dss: any) => {
    setEditingRecord(dss.id);
    setEditingData(dss);
    
    // Set up presences based on participantes_ids
    const editPresences: Record<string, boolean> = {};
    if (dss.participantes_ids && Array.isArray(dss.participantes_ids)) {
      dss.participantes_ids.forEach((id: string) => {
        editPresences[id] = true;
      });
    }
    setPresencas(editPresences);
  };

  const handleUpdate = async () => {
    if (!editingRecord || !editingData) return;

    const participantesPresentes = Object.keys(presencas).filter(id => presencas[id]);

    await updateDSS(editingRecord, {
      titulo: editingData.titulo,
      descricao: editingData.descricao,
      observacoes: `${participantesPresentes.length} funcionários presentes`,
      topics: editingData.topics,
      participantes_ids: participantesPresentes
    });

    setEditingRecord(null);
    setEditingData(null);
    setPresencas({});
  };

  const handleDelete = async (id: string) => {
    await deleteDSS(id);
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditingData(null);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Local do DSS *</Label>
              <Select value={localDssId} onValueChange={setLocalDssId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o local" />
                </SelectTrigger>
                <SelectContent>
                  {locaisDSS.map(local => (
                    <SelectItem key={local.id} value={local.id}>
                      {local.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
            
            {!localDssId ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <p>Selecione o local do DSS para visualizar os funcionários vinculados.</p>
              </div>
            ) : funcionariosFiltrados.length > 0 ? (
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
                    {funcionariosFiltrados.map((funcionario) => (
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
                <p>Nenhum funcionário vinculado a este local.</p>
                <p className="text-sm">Cadastre funcionários vinculados ao local {locaisDSS.find(l => l.id === localDssId)?.nome}.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => {
              setSelectedDate(undefined);
              setTema("");
              setLocalDssId("");
              setPresencas({});
            }}>
              Cancelar
            </Button>
            <Button 
              className="gap-2" 
              onClick={handleSave}
              disabled={!selectedDate || !tema.trim() || !localDssId || funcionariosFiltrados.length === 0}
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
                  {editingRecord === dss.id ? (
                    // Modo de edição
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Título</label>
                          <Input
                            value={editingData?.titulo || ""}
                            onChange={(e) => setEditingData({...editingData, titulo: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Tópicos (separados por vírgula)</label>
                          <Input
                            value={editingData?.topics?.join(", ") || ""}
                            onChange={(e) => setEditingData({...editingData, topics: e.target.value.split(",").map((t: string) => t.trim()).filter((t: string) => t)})}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-sm font-medium">Descrição</label>
                          <Textarea
                            value={editingData?.descricao || ""}
                            onChange={(e) => setEditingData({...editingData, descricao: e.target.value})}
                          />
                        </div>
                      </div>

                      {/* Lista de presença para edição */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium">Lista de Presença</h4>
                        
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
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleCancelEdit}>
                          Cancelar
                        </Button>
                        <Button onClick={handleUpdate}>
                          Salvar Alterações
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // Modo de visualização
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{dss.titulo}</h4>
                          {dss.local_dss && (
                            <span className="text-sm text-muted-foreground">
                              Local: {dss.local_dss.nome}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(dss.data_realizacao), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(dss)}
                            className="h-8 w-8 p-0"
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
                                <AlertDialogTitle>Excluir DSS</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este DSS? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(dss.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
                    </>
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