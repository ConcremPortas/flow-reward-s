// Página Faltas/Advertências - Grid mensal de apuração
import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Plus, Search, Save, Calendar, Edit, Trash2, Filter, Eye, Download, UploadCloud } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import * as XLSX from "xlsx";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useFaltasAdvertencias } from "@/hooks/useFaltasAdvertencias";
import { useToast } from "@/hooks/use-toast";

export const FaltasAdvertencias = () => {
  const { funcionarios, loading } = useFuncionarios();
  const {
    registros,
    loading: registrosLoading,
    salvarApuracaoMensal,
    deleteRegistrosPorCompetencia,
    updateRegistro,
    deleteRegistro,
  } = useFaltasAdvertencias();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSetor, setSelectedSetor] = useState("Todos");
  const [selectedCategoria, setSelectedCategoria] = useState("Todos");
  const [filtroMesCompetencia, setFiltroMesCompetencia] = useState("");
  const [mesCompetencia, setMesCompetencia] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const { toast } = useToast();
  const apuracaoRef = useRef<HTMLDivElement | null>(null);
  const historicoRef = useRef<HTMLDivElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const downloadTemplateFaltas = () => {
    const rows = funcionariosAtivos.map(f => ({
      cod_funcionario: f.cpf || "",
      funcionario: f.nome,
      faltas: 0,
      advertencias: 0,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Faltas");
    XLSX.writeFile(wb, `template_faltas_${mesCompetencia}.xlsx`);
  };

  const handleImportFaltas = async () => {
    if (!importFile || !mesCompetencia) return;
    setIsImporting(true);
    try {
      const buffer = await importFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval: "" }) as any[];

      const codMap = new Map<string, string>();
      funcionariosAtivos.forEach(f => { if (f.cpf) codMap.set(String(f.cpf).trim(), f.id); });

      const novosApuracao: Record<string, { faltas: number; advertencias: number }> = {};
      let ignorados = 0;

      for (const row of data) {
        const cod = String(row.cod_funcionario || row.COD_FUNCIONARIO || "").trim();
        const faltas = parseInt(row.faltas || row.FALTAS || "0") || 0;
        const advertencias = parseInt(row.advertencias || row.ADVERTENCIAS || "0") || 0;
        const funcionarioId = codMap.get(cod);
        if (!funcionarioId) { ignorados++; continue; }
        if (faltas > 0 || advertencias > 0) {
          novosApuracao[funcionarioId] = { faltas, advertencias };
        }
      }

      if (Object.keys(novosApuracao).length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: `Nenhuma falta/advertência > 0 encontrada. ${ignorados} linha(s) ignorada(s) por código não reconhecido.`,
          variant: "destructive"
        });
        setIsImporting(false);
        return;
      }

      // Atualiza o grid com os dados importados para o usuário visualizar
      setDadosApuracao(novosApuracao);

      const result = await salvarApuracaoMensal(mesCompetencia, novosApuracao);
      if (result) {
        toast({
          title: "Importação concluída",
          description: `${result.inserted} registro(s) salvo(s). ${ignorados} funcionário(s) ignorado(s) (código não encontrado).`
        });
        setIsImportOpen(false);
        setImportFile(null);
        setFiltroMesCompetencia(mesCompetencia);
      }
    } catch (e: any) {
      toast({ title: "Erro na importação", description: e?.message || "Falha ao importar arquivo", variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };
  
  // Estado para armazenar as faltas e advertências do grid
  const [dadosApuracao, setDadosApuracao] = useState<{
    [funcionarioId: string]: {
      faltas: number;
      advertencias: number;
    }
  }>({});

  const isFuncionarioAtivo = (funcionario: { ativo?: boolean; status?: string }) => {
    const status = (funcionario.status || '').toLowerCase();
    return status !== 'rescisao' && status !== 'rescisão';
  };

  const funcionariosAtivos = funcionarios
    .filter((funcionario) => isFuncionarioAtivo(funcionario))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  const setoresDisponiveis = ["Todos", ...Array.from(new Set(
    funcionariosAtivos.map(f => f.setor?.nome).filter(Boolean)
  )).sort()];
  const categoriasDisponiveis = ["Todos", ...Array.from(new Set(
    funcionariosAtivos.map(f => f.categoria?.nome).filter(Boolean)
  )).sort()];

  const filteredFuncionarios = funcionariosAtivos.filter((funcionario) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      funcionario.nome.toLowerCase().includes(term) ||
      (funcionario.cpf || '').toLowerCase().includes(term) ||
      (funcionario.setor?.nome || '').toLowerCase().includes(term) ||
      (funcionario.categoria?.nome || '').toLowerCase().includes(term);
    const matchesSetor = selectedSetor === "Todos" || funcionario.setor?.nome === selectedSetor;
    const matchesCategoria = selectedCategoria === "Todos" || funcionario.categoria?.nome === selectedCategoria;
    return matchesSearch && matchesSetor && matchesCategoria;
  });

  const handleQuantidadeChange = (funcionarioId: string, tipo: 'faltas' | 'advertencias', valor: string) => {
    const quantidade = parseInt(valor) || 0;
    setDadosApuracao(prev => ({
      ...prev,
      [funcionarioId]: {
        ...prev[funcionarioId],
        [tipo]: quantidade
      }
    }));
  };

  const handleSalvarApuracao = async () => {
    if (!mesCompetencia) {
      alert("Por favor, selecione o mês de competência");
      return;
    }
    
    // Salvar apenas funcionários que têm faltas ou advertências
    const funcionariosComOcorrencias = Object.entries(dadosApuracao).filter(([_, dados]) => 
      dados.faltas > 0 || dados.advertencias > 0
    );

    if (funcionariosComOcorrencias.length === 0) {
      alert("Nenhuma falta ou advertência foi lançada para salvar");
      return;
    }

    const payload: Record<string, { faltas: number; advertencias: number }> = {};
    for (const [funcionarioId, dados] of funcionariosComOcorrencias) {
      payload[funcionarioId] = { faltas: dados.faltas, advertencias: dados.advertencias };
    }

    const result = await salvarApuracaoMensal(mesCompetencia, payload);
    if (!result) return;

    // Limpar dados após salvar
    setDadosApuracao({});
    setFiltroMesCompetencia(mesCompetencia);
    requestAnimationFrame(() => historicoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const handleEditarRegistro = async (registro: any) => {
    // Aqui você pode implementar a lógica de edição
    const novaQuantidade = prompt(`Editar quantidade de ${registro.tipo}s para ${funcionarios.find(f => f.id === registro.funcionario_id)?.nome}:`, registro.quantidade?.toString());
    
    if (novaQuantidade && parseInt(novaQuantidade) !== registro.quantidade) {
      await updateRegistro(registro.id, {
        quantidade: parseInt(novaQuantidade),
        descricao: `${parseInt(novaQuantidade)} ${registro.tipo}(s) registrada(s) na apuração mensal`
      });
    }
  };

  const handleExcluirRegistro = async (id: string, funcionarioNome: string) => {
    await deleteRegistro(id);
  };

  const formatCompetencia = (competencia: string) => {
    if (!competencia) return '';
    const [ano, mes] = competencia.split('-');
    return `${mes}/${ano}`;
  };

  const apuracoesLancadas = (() => {
    const map = new Map<
      string,
      {
        competencia: string;
        total_registros: number;
        total_faltas: number;
        total_advertencias: number;
        funcionarios: Set<string>;
      }
    >();

    for (const r of registros) {
      const competencia = r.data_ocorrencia?.slice(0, 7);
      if (!competencia) continue;
      const current = map.get(competencia) || {
        competencia,
        total_registros: 0,
        total_faltas: 0,
        total_advertencias: 0,
        funcionarios: new Set<string>(),
      };

      current.total_registros += 1;
      const qtd = r.quantidade || 1;
      if (r.tipo === 'falta') current.total_faltas += qtd;
      if (r.tipo === 'advertencia') current.total_advertencias += qtd;
      if (r.funcionario_id) current.funcionarios.add(r.funcionario_id);

      map.set(competencia, current);
    }

    return Array.from(map.values()).sort((a, b) => (a.competencia < b.competencia ? 1 : -1));
  })();

  const handleVisualizarCompetencia = (competencia: string) => {
    setFiltroMesCompetencia(competencia);
    requestAnimationFrame(() => historicoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const handleEditarCompetencia = (competencia: string) => {
    setMesCompetencia(competencia);

    const dataCompetencia = `${competencia}-01`;
    const dados: Record<string, { faltas: number; advertencias: number }> = {};
    for (const r of registros) {
      if (r.data_ocorrencia !== dataCompetencia) continue;
      if (!r.funcionario_id) continue;
      const current = dados[r.funcionario_id] || { faltas: 0, advertencias: 0 };
      const qtd = r.quantidade || 1;
      if (r.tipo === 'falta') current.faltas = qtd;
      if (r.tipo === 'advertencia') current.advertencias = qtd;
      dados[r.funcionario_id] = current;
    }

    setDadosApuracao(dados);
    requestAnimationFrame(() => apuracaoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const handleExcluirCompetencia = async (competencia: string) => {
    const ok = await deleteRegistrosPorCompetencia(competencia);
    if (!ok) return;
    if (filtroMesCompetencia === competencia) setFiltroMesCompetencia('');
    if (mesCompetencia === competencia) setDadosApuracao({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando faltas/advertências...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grid de Apuração Mensal */}
      <div ref={apuracaoRef} />
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Apuração Mensal - Faltas e Advertências
          </CardTitle>
          <CardDescription>
            Lance as faltas e advertências do mês de competência para todos os funcionários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mês de Competência *</label>
              <Input
                type="month"
                value={mesCompetencia}
                onChange={(e) => setMesCompetencia(e.target.value)}
                className="w-auto"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsImportOpen(true)} className="gap-2">
                <UploadCloud className="h-4 w-4" />
                Importar
              </Button>
              <Button
                onClick={handleSalvarApuracao}
                className="gap-2"
                disabled={Object.keys(dadosApuracao).length === 0}
              >
                <Save className="h-4 w-4" />
                Salvar Apuração
              </Button>
            </div>

            {/* Dialog de importação */}
            <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Importar Faltas e Advertências</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <p className="text-sm text-muted-foreground">
                    Competência: <strong>{mesCompetencia}</strong>. O template é gerado com todos os funcionários ativos.
                  </p>
                  <Button variant="outline" onClick={downloadTemplateFaltas} className="gap-2 w-full">
                    <Download className="h-4 w-4" />
                    Baixar Template
                  </Button>
                  <Input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    ref={importInputRef}
                    onChange={e => setImportFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => { setIsImportOpen(false); setImportFile(null); }}>Cancelar</Button>
                    <Button onClick={handleImportFaltas} disabled={!importFile || isImporting} className="gap-2">
                      <UploadCloud className="h-4 w-4" />
                      {isImporting ? "Importando..." : "Importar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filtros de busca */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative md:col-span-2">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, código, setor ou categoria..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedSetor} onValueChange={setSelectedSetor}>
              <SelectTrigger>
                <SelectValue placeholder="Setor" />
              </SelectTrigger>
              <SelectContent>
                {setoresDisponiveis.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoriasDisponiveis.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grid de funcionários */}
          {funcionariosAtivos.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead className="text-center">Faltas</TableHead>
                    <TableHead className="text-center">Advertências</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFuncionarios.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                        Nenhum funcionário encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFuncionarios.map((funcionario) => (
                      <TableRow key={funcionario.id}>
                        <TableCell className="font-medium">
                          {funcionario.nome}
                        </TableCell>
                        <TableCell>
                          {funcionario.setor?.nome || "Sem setor"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="w-20 text-center"
                            value={dadosApuracao[funcionario.id]?.faltas || ''}
                            onChange={(e) => handleQuantidadeChange(funcionario.id, 'faltas', e.target.value)}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            className="w-20 text-center"
                            value={dadosApuracao[funcionario.id]?.advertencias || ''}
                            onChange={(e) => handleQuantidadeChange(funcionario.id, 'advertencias', e.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              <p>Nenhum funcionário ativo encontrado.</p>
              <p className="text-sm">Verifique os funcionários com status ativo e ativo=true.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Registros */}
      <div ref={historicoRef} />
      <Card className="card-elegant">
        <CardHeader>
          <CardTitle>Histórico de Apurações</CardTitle>
          <CardDescription>
            Registros históricos de faltas e advertências já lançados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            <h3 className="text-lg font-medium">Apurações Lançadas por Competência</h3>
            {apuracoesLancadas.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground border rounded-lg">
                <p>Nenhuma apuração realizada ainda.</p>
                <p className="text-sm">As apurações aparecerão aqui após serem salvas.</p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Competência</TableHead>
                      <TableHead className="text-right">Funcionários</TableHead>
                      <TableHead className="text-right">Faltas</TableHead>
                      <TableHead className="text-right">Advertências</TableHead>
                      <TableHead className="text-right">Registros</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apuracoesLancadas.map((item) => (
                      <TableRow
                        key={item.competencia}
                        className="cursor-pointer hover:bg-muted/30"
                        onClick={() => handleVisualizarCompetencia(item.competencia)}
                      >
                        <TableCell className="font-medium">{formatCompetencia(item.competencia)}</TableCell>
                        <TableCell className="text-right">{item.funcionarios.size}</TableCell>
                        <TableCell className="text-right">{item.total_faltas}</TableCell>
                        <TableCell className="text-right">{item.total_advertencias}</TableCell>
                        <TableCell className="text-right">{item.total_registros}</TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleVisualizarCompetencia(item.competencia)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditarCompetencia(item.competencia)}
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
                                  <AlertDialogTitle>Excluir apuração</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Remover todos os registros da competência {formatCompetencia(item.competencia)}? Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleExcluirCompetencia(item.competencia)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          {/* Filtros */}
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtros:</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Funcionário</label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Mês Competência</label>
                <Input
                  type="month"
                  value={filtroMesCompetencia}
                  onChange={(e) => setFiltroMesCompetencia(e.target.value)}
                  placeholder="Filtrar por mês"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedSetor("Todos");
                    setSelectedCategoria("Todos");
                    setFiltroMesCompetencia("");
                  }}
                  className="w-full"
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </div>
          
          {registrosLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-lg">Carregando histórico...</div>
            </div>
          ) : registros.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Quantidade</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros
                    .filter(registro => {
                      const funcionario = funcionarios.find(f => f.id === registro.funcionario_id);
                      const funcionarioMatch = !searchTerm || funcionario?.nome.toLowerCase().includes(searchTerm.toLowerCase());
                      
                      const dataRegistro = new Date(registro.data_ocorrencia);
                      const mesRegistro = `${dataRegistro.getFullYear()}-${String(dataRegistro.getMonth() + 1).padStart(2, '0')}`;
                      const mesMatch = !filtroMesCompetencia || mesRegistro === filtroMesCompetencia;
                      
                      return funcionarioMatch && mesMatch;
                    })
                    .sort((a, b) => new Date(b.data_ocorrencia).getTime() - new Date(a.data_ocorrencia).getTime())
                    .map((registro) => {
                      const funcionario = funcionarios.find(f => f.id === registro.funcionario_id);
                      return (
                        <TableRow key={registro.id}>
                          <TableCell className="font-medium">
                            {funcionario?.nome || "Funcionário não encontrado"}
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              registro.tipo === 'falta' 
                                ? 'bg-orange-100 text-orange-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {registro.tipo === 'falta' ? 'Falta' : 'Advertência'}
                            </span>
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {registro.quantidade || 1}
                          </TableCell>
                          <TableCell>
                            {format(new Date(registro.data_ocorrencia), "MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            {registro.descricao || registro.motivo}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditarRegistro(registro)}
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
                                    <AlertDialogTitle>Excluir Registro</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir este registro de {funcionario?.nome || "funcionário"}? Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleExcluirRegistro(registro.id, funcionario?.nome || "Funcionário")}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              <p>Nenhuma apuração realizada ainda.</p>
              <p className="text-sm">As apurações aparecerão aqui após serem salvas.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
