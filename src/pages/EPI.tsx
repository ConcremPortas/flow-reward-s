// Página EPI - conectada ao banco de dados
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { CalendarIcon, Save, FileText, Edit, Trash2 } from "lucide-react";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useEPI } from "@/hooks/useEPI";

export const EPI = () => {
  const { funcionarios, loading } = useFuncionarios();
  const { epiRecords, loading: epiLoading, createEPI, updateEPI, deleteEPI } = useEPI();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [statusEPI, setStatusEPI] = useState<Record<string, string>>({});
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>(null);
  const [editSelectedFuncionario, setEditSelectedFuncionario] = useState<string>("");

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
    setEditingRecord(null);
    setEditingData(null);
  };

  const handleEdit = (epi: any) => {
    setEditingRecord(epi.id);
    setEditingData(epi);
    // Set up the status for the specific funcionario from the EPI record
    const editStatus: Record<string, string> = {};
    if (epi.funcionario_id) {
      editStatus[epi.funcionario_id] = epi.status || "nao_conforme";
    }
    setStatusEPI(editStatus);
  };

  const handleUpdate = async () => {
    if (!editingRecord || !editingData) return;

    // Get the funcionario_id and their status from statusEPI
    const funcionarioId = Object.keys(statusEPI)[0];
    const status = statusEPI[funcionarioId] || "nao_conforme";

    await updateEPI(editingRecord, {
      funcionario_id: funcionarioId,
      tipo_epi: editingData.tipo_epi,
      status: status,
      descricao: editingData.descricao,
      observacoes: `Status: ${status === 'conforme' ? 'Conforme' : 'Não conforme'}`,
      numero_ca: editingData.numero_ca,
      data_vencimento: editingData.data_vencimento
    });

    setEditingRecord(null);
    setEditingData(null);
    setStatusEPI({});
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este registro de EPI?")) {
      await deleteEPI(id);
    }
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditingData(null);
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
          {epiLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg">Carregando histórico...</div>
            </div>
          ) : epiRecords.length > 0 ? (
            <div className="space-y-4">
              {epiRecords.map((epi) => (
                <div key={epi.id} className="border rounded-lg p-4">
                  {editingRecord === epi.id ? (
                    // Modo de edição
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Tipo de EPI</label>
                          <Input
                            value={editingData?.tipo_epi || ""}
                            onChange={(e) => setEditingData({...editingData, tipo_epi: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Status</label>
                          <Select 
                            value={editingData?.status || ""} 
                            onValueChange={(value) => setEditingData({...editingData, status: value})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="conforme">Conforme</SelectItem>
                              <SelectItem value="nao_conforme">Não conforme</SelectItem>
                              <SelectItem value="entregue">Entregue</SelectItem>
                              <SelectItem value="vencido">Vencido</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Número CA</label>
                          <Input
                            value={editingData?.numero_ca || ""}
                            onChange={(e) => setEditingData({...editingData, numero_ca: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Data de Vencimento</label>
                          <Input
                            type="date"
                            value={editingData?.data_vencimento || ""}
                            onChange={(e) => setEditingData({...editingData, data_vencimento: e.target.value})}
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

                      {/* Lista de funcionários para auditoria */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium">Status dos EPIs por Funcionário</h4>
                        
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
                        <h4 className="font-medium">{epi.tipo_epi}</h4>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(epi.data_entrega), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(epi)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(epi.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {epi.descricao && (
                        <p className="text-sm text-muted-foreground mb-2">{epi.descricao}</p>
                      )}
                      <div className="flex gap-4 text-sm">
                        <span>
                          <strong>Status:</strong> {epi.status === 'conforme' ? 'Conforme' : 'Não conforme'}
                        </span>
                        {epi.numero_ca && (
                          <span>
                            <strong>CA:</strong> {epi.numero_ca}
                          </span>
                        )}
                        {epi.data_vencimento && (
                          <span>
                            <strong>Vencimento:</strong> {format(new Date(epi.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </div>
                      {epi.observacoes && (
                        <p className="text-sm text-muted-foreground mt-2">{epi.observacoes}</p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              <p>Nenhuma auditoria de EPI realizada ainda.</p>
              <p className="text-sm">As auditorias realizadas aparecerão aqui.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};