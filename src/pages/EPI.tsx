// Página EPI - conectada ao banco de dados
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/PageHeader";
import { SectionCard } from "@/components/app/SectionCard";
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
import { parseDateSafe } from "@/lib/dateUtils";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Save, FileText, Edit, Trash2, Search, HardHat } from "lucide-react";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useEPI } from "@/hooks/useEPI";

export const EPI = () => {
  const { funcionarios, loading } = useFuncionarios();
  const { epiRecords, loading: epiLoading, createEPI, updateEPI, deleteEPI } = useEPI();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [searchTerm, setSearchTerm] = useState("");
  // Armazena apenas os NÃO conformes; ausente = conforme por padrão
  const [naoConformes, setNaoConformes] = useState<Set<string>>(new Set());
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<any>(null);
  const [editNaoConformes, setEditNaoConformes] = useState<Set<string>>(new Set());

  const isFuncionarioAtivo = (f: { ativo?: boolean; status?: string }) => {
    const status = (f.status || '').toLowerCase();
    return status !== 'rescisao' && status !== 'rescisão';
  };

  const funcionariosAtivos = funcionarios
    .filter(isFuncionarioAtivo)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const filteredFuncionariosAtivos = funcionariosAtivos.filter(f => {
    const term = searchTerm.toLowerCase();
    return !term ||
      f.nome.toLowerCase().includes(term) ||
      (f.cpf || '').toLowerCase().includes(term) ||
      (f.setor?.nome || '').toLowerCase().includes(term) ||
      (f.categoria?.nome || '').toLowerCase().includes(term);
  });

  const handleStatusChange = (funcionarioId: string, conforme: boolean) => {
    setNaoConformes(prev => {
      const next = new Set(prev);
      if (conforme) next.delete(funcionarioId);
      else next.add(funcionarioId);
      return next;
    });
  };

  const handleEditStatusChange = (funcionarioId: string, conforme: boolean) => {
    setEditNaoConformes(prev => {
      const next = new Set(prev);
      if (conforme) next.delete(funcionarioId);
      else next.add(funcionarioId);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedDate) {
      alert("Por favor, selecione a data da auditoria");
      return;
    }

    const totalConformes = funcionariosAtivos.filter(f => !naoConformes.has(f.id)).length;
    const totalNaoConformes = naoConformes.size;

    const funcionariosInfo = funcionariosAtivos.map(f =>
      `${f.nome}: ${naoConformes.has(f.id) ? 'Não conforme' : 'Conforme'}`
    ).join('\n');

    await createEPI({
      funcionario_id: null,
      tipo_epi: "Auditoria Geral de EPI",
      data_entrega: selectedDate.toISOString().split('T')[0],
      status: totalNaoConformes === 0 ? "conforme" : "nao_conforme",
      descricao: `Auditoria de EPI realizada em ${selectedDate.toLocaleDateString('pt-BR')} - ${funcionariosAtivos.length} funcionários auditados`,
      observacoes: `Resumo: ${totalConformes} conformes, ${totalNaoConformes} não conformes\n\nDetalhes:\n${funcionariosInfo}`
    });

    setSelectedDate(undefined);
    setNaoConformes(new Set());
  };

  const handleEdit = (epi: any) => {
    setEditingRecord(epi.id);
    setEditingData(epi);
    // Reconstrói os não-conformes a partir das observações salvas
    const nc = new Set<string>();
    if (epi.observacoes) {
      funcionariosAtivos.forEach(f => {
        if (epi.observacoes.includes(`${f.nome}: Não conforme`)) nc.add(f.id);
      });
    }
    setEditNaoConformes(nc);
  };

  const handleUpdate = async () => {
    if (!editingRecord || !editingData) return;

    const totalConformes = funcionariosAtivos.filter(f => !editNaoConformes.has(f.id)).length;
    const totalNaoConformes = editNaoConformes.size;
    const funcionariosInfo = funcionariosAtivos.map(f =>
      `${f.nome}: ${editNaoConformes.has(f.id) ? 'Não conforme' : 'Conforme'}`
    ).join('\n');

    await updateEPI(editingRecord, {
      funcionario_id: editingData.funcionario_id,
      tipo_epi: editingData.tipo_epi,
      status: totalNaoConformes === 0 ? "conforme" : "nao_conforme",
      descricao: editingData.descricao,
      observacoes: `Resumo: ${totalConformes} conformes, ${totalNaoConformes} não conformes\n\nDetalhes:\n${funcionariosInfo}`,
      numero_ca: editingData.numero_ca,
      data_vencimento: editingData.data_vencimento
    });

    setEditingRecord(null);
    setEditingData(null);
    setEditNaoConformes(new Set());
  };

  const handleDelete = async (id: string) => {
    await deleteEPI(id);
  };

  const handleCancelEdit = () => {
    setEditingRecord(null);
    setEditingData(null);
    setEditNaoConformes(new Set());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando EPI...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        icon={HardHat}
        title="EPI"
        description="Auditorias de equipamentos de proteção individual."
      />

      {/* Nova Auditoria EPI */}
      <SectionCard
        title="Nova Auditoria de EPI"
        description="Registre uma nova auditoria de equipamentos de proteção individual"
      >
        <div className="space-y-6">
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
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Status dos EPIs por Funcionário</h3>
              <div className="relative w-72">
                <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, código, setor ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {funcionariosAtivos.length > 0 ? (
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
                    {filteredFuncionariosAtivos.map((funcionario) => (
                      <TableRow key={funcionario.id}>
                        <TableCell className="font-medium">{funcionario.nome}</TableCell>
                        <TableCell>{funcionario.setor?.nome || "Não informado"}</TableCell>
                        <TableCell>{funcionario.empresa?.nome || "Não informado"}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center">
                            <Switch
                              className="switch-conforme"
                              checked={!naoConformes.has(funcionario.id)}
                              onCheckedChange={(checked) =>
                                handleStatusChange(funcionario.id, checked)
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
              setNaoConformes(new Set());
            }}>
              Cancelar
            </Button>
            <Button
              className="gap-2"
              onClick={handleSave}
              disabled={!selectedDate || funcionariosAtivos.length === 0}
            >
              <Save className="h-4 w-4" />
              Salvar Auditoria
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Histórico de Auditorias */}
      <SectionCard
        title="Histórico de Auditorias"
        description="Auditorias de EPI realizadas"
        actions={
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Relatório
          </Button>
        }
      >
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
                            onValueChange={(value) => {
                              setEditingData({...editingData, status: value});
                            }}
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

                        {funcionariosAtivos.length > 0 ? (
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
                                {filteredFuncionariosAtivos.map((funcionario) => (
                                  <TableRow key={funcionario.id}>
                                    <TableCell className="font-medium">{funcionario.nome}</TableCell>
                                    <TableCell>{funcionario.setor?.nome || "Não informado"}</TableCell>
                                    <TableCell>{funcionario.empresa?.nome || "Não informado"}</TableCell>
                                    <TableCell className="text-center">
                                      <div className="flex items-center justify-center">
                                        <Switch
                                          className="switch-conforme"
                                          checked={!editNaoConformes.has(funcionario.id)}
                                          onCheckedChange={(checked) =>
                                            handleEditStatusChange(funcionario.id, checked)
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
                            {format(parseDateSafe(epi.data_entrega), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(epi)}
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
                                <AlertDialogTitle>Excluir Registro de EPI</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir este registro de EPI? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(epi.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
                            <strong>Vencimento:</strong> {format(parseDateSafe(epi.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}
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
      </SectionCard>
    </div>
  );
};