import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/PageHeader";
import { SectionCard } from "@/components/app/SectionCard";
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
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Edit, TrendingUp, TrendingDown, Minus, Trash2, UploadCloud, Download, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSetores } from "@/hooks/useSetores";
import { useProducaoSetor } from "@/hooks/useProducaoSetor";
import { formatDateToBrasilia, formatDateToBrazilian, formatDateToInput } from "@/lib/dateUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";

export const ProducaoSetor = () => {
  const { setores, loading: setoresLoading } = useSetores();
  const { registros, loading: registrosLoading, createRegistro, updateRegistro, deleteRegistro, refetch } = useProducaoSetor();
  const [searchTerm, setSearchTerm] = useState("");
  const [competenciaFilter, setCompetenciaFilter] = useState("all");
  const [setorFilter, setSetorFilter] = useState("");
  const [setorSelecionado, setSetorSelecionado] = useState("");
  const [dataProducao, setDataProducao] = useState("");
  const [metaDiaria, setMetaDiaria] = useState("");
  const [producaoRealizada, setProducaoRealizada] = useState("");
  const [unidadeMedida, setUnidadeMedida] = useState("unidades");
  const [observacoes, setObservacoes] = useState("");
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [skippedRows, setSkippedRows] = useState<{ setor_id: string; setor_nome: string; competencia: string }[]>([]);
  const [insertedCount, setInsertedCount] = useState(0);
  const [invalidRows, setInvalidRows] = useState<{ linha: number; setor_nome: string; competencia: string; motivo: string }[]>(
    [],
  );
  const [competenciaDelete, setCompetenciaDelete] = useState("");
  const { toast } = useToast();

  const normalizeKey = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w]+/g, "_")
      .replace(/^_+|_+$/g, "");

  const normalizeName = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");

  const toNumber = (value: unknown): number | null => {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    const raw = String(value ?? "").trim();
    if (!raw) return null;
    const cleaned =
      raw.includes(",") && raw.includes(".")
        ? raw.replace(/\./g, "").replace(",", ".")
        : raw.includes(",")
          ? raw.replace(",", ".")
          : raw;
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : null;
  };

  const parseCompetenciaToISO = (value: unknown): string => {
    if (!value) return "";
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, "0");
      return `${year}-${month}-01`;
    }

    if (typeof value === "number") {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed?.y && parsed?.m) {
        const year = String(parsed.y).padStart(4, "0");
        const month = String(parsed.m).padStart(2, "0");
        return `${year}-${month}-01`;
      }
    }

    const str = String(value).trim();
    if (!str) return "";

    const yyyyMm = str.match(/^(\d{4})-(\d{2})/);
    if (yyyyMm) return `${yyyyMm[1]}-${yyyyMm[2]}-01`;

    const mmYyyySlash = str.match(/^(\d{2})\/(\d{4})$/);
    if (mmYyyySlash) return `${mmYyyySlash[2]}-${mmYyyySlash[1]}-01`;

    const mmYyyyDash = str.match(/^(\d{2})-(\d{4})$/);
    if (mmYyyyDash) return `${mmYyyyDash[2]}-${mmYyyyDash[1]}-01`;

    const yyyyMmSlash = str.match(/^(\d{4})\/(\d{2})$/);
    if (yyyyMmSlash) return `${yyyyMmSlash[1]}-${yyyyMmSlash[2]}-01`;

    return "";
  };

  const resolveSetorId = (row: Record<string, unknown>) => {
    const setorId = String(row.setor_id ?? "").trim();
    if (setorId) return setorId;

    const nameCandidate = String(row.setor_nome ?? row.setor ?? row.setor_name ?? "").trim();
    if (!nameCandidate) return "";

    const target = normalizeName(nameCandidate);
    const found = setores.find((s) => normalizeName(s.nome) === target);
    if (found) return found.id;

    const foundPrefix = setores.find((s) => target.startsWith(normalizeName(s.nome)));
    return foundPrefix?.id || "";
  };

  // Obter competências únicas dos registros
  const competenciasDisponiveis = Array.from(
    new Set(
      registros.map(item => {
        if (!item.data_producao) return '';
        const date = new Date(item.data_producao);
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      }).filter(Boolean)
    )
  ).sort((a, b) => {
    const [monthA, yearA] = a.split('/').map(Number);
    const [monthB, yearB] = b.split('/').map(Number);
    return yearB - yearA || monthB - monthA;
  });

  const filteredRegistros = registros
    .filter(item => item.unidade_medida !== "percentual") // Excluir indicadores (que usam percentual)
    .filter(item => {
      const monthYear = item.data_producao ? (() => {
        const date = new Date(item.data_producao);
        return `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
      })() : '';
      
      const matchesSearch = item.setor?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           monthYear.includes(searchTerm);
      
      const matchesCompetencia = !competenciaFilter || competenciaFilter === "all" || monthYear === competenciaFilter;
      
      const matchesSetor = !setorFilter || setorFilter === "all" || item.setor_id === setorFilter;
      
      return matchesSearch && matchesCompetencia && matchesSetor;
    });

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

  const handleSave = async () => {
    if (!setorSelecionado || !dataProducao || !metaDiaria || !producaoRealizada) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    // Ajustar data para fuso horário de Brasília
    const dataFormatada = formatDateToBrasilia(dataProducao);

    const registro = {
      setor_id: setorSelecionado,
      data_producao: dataFormatada,
      meta_diaria: parseFloat(metaDiaria),
      producao_realizada: parseFloat(producaoRealizada),
      unidade_medida: unidadeMedida,
      observacoes: observacoes || undefined
    };

    if (editingRecord) {
      await updateRegistro(editingRecord, registro);
    } else {
      await createRegistro(registro);
    }

    // Reset form
    setSetorSelecionado("");
    setDataProducao("");
    setMetaDiaria("");
    setProducaoRealizada("");
    setUnidadeMedida("unidades");
    setObservacoes("");
    setEditingRecord(null);
  };

  const handleEdit = (registro: any) => {
    setSetorSelecionado(registro.setor_id);
    setDataProducao(formatDateToInput(registro.data_producao));
    setMetaDiaria(registro.meta_diaria.toString());
    setProducaoRealizada(registro.producao_realizada.toString());
    setUnidadeMedida(registro.unidade_medida);
    setObservacoes(registro.observacoes || "");
    setEditingRecord(registro.id);
  };

  const handleDelete = async (id: string) => {
    await deleteRegistro(id);
  };

  const handleCancel = () => {
    setSetorSelecionado("");
    setDataProducao("");
    setMetaDiaria("");
    setProducaoRealizada("");
    setUnidadeMedida("unidades");
    setObservacoes("");
    setEditingRecord(null);
  };

  const downloadTemplate = () => {
    const rows = setores.filter(s => s.ativo).map(s => ({
      setor_id: s.id,
      setor_nome: s.nome,
      competencia: "",
      meta_mensal: "",
      producao_realizada: "",
      unidade_medida: "unidades",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "template_producao_setor.xlsx");
  };

  const handleImport = async () => {
    if (!importFile) return;
    try {
      setIsImporting(true);
      setImportProgress(0);
      setSkippedRows([]);
      setInsertedCount(0);
      setInvalidRows([]);
      const buffer = await importFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const rows: any[] = [];
      const rawRows: { setor_id: string; setor_nome: string; competencia: string }[] = [];
      const invalid: { linha: number; setor_nome: string; competencia: string; motivo: string }[] = [];

      for (let i = 0; i < (data as any[]).length; i++) {
        const row = (data as any[])[i] as Record<string, unknown>;
        const normalized: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row)) normalized[normalizeKey(k)] = v;

        const setorId = resolveSetorId(normalized);
        const setorNome = String(normalized.setor_nome ?? normalized.setor ?? "").trim();

        const competenciaISO = parseCompetenciaToISO(normalized.competencia ?? normalized.data_producao ?? normalized.mes_ano);
        const dataProducao = competenciaISO ? formatDateToBrasilia(competenciaISO) : "";

        const meta = toNumber(normalized.meta_mensal ?? normalized.meta ?? normalized.meta_diaria);
        const realizado = toNumber(normalized.producao_realizada ?? normalized.realizado ?? normalized.producao);
        const unidade = String(normalized.unidade_medida ?? normalized.unidade ?? "unidades").trim() || "unidades";

        const motivos: string[] = [];
        if (!setorId) motivos.push("Setor não identificado (use setor_id ou setor_nome)");
        if (!dataProducao) motivos.push("Competência inválida (use YYYY-MM)");
        if (meta === null || meta <= 0) motivos.push("Meta mensal inválida");
        if (realizado === null || realizado < 0) motivos.push("Produção realizada inválida");

        if (motivos.length) {
          invalid.push({
            linha: i + 2,
            setor_nome: setorNome || setores.find((s) => s.id === setorId)?.nome || "",
            competencia: String(normalized.competencia ?? "").trim(),
            motivo: motivos.join("; "),
          });
          continue;
        }

        const r = {
          setor_id: setorId,
          data_producao: dataProducao,
          meta_diaria: meta,
          producao_realizada: realizado,
          unidade_medida: unidade,
        };

        rows.push(r);
        rawRows.push({
          setor_id: setorId,
          setor_nome: setores.find((s) => s.id === setorId)?.nome || setorNome,
          competencia: dataProducao,
        });
      }

      setInvalidRows(invalid);

      if (rows.length === 0) {
        toast({
          title: "Nenhuma linha válida",
          description: invalid.length
            ? `Arquivo lido, mas ${invalid.length} linha(s) foram rejeitadas. Confira a lista no modal.`
            : "Arquivo lido, mas nenhuma linha foi reconhecida. Confira o template.",
          variant: "destructive",
        });
        setIsImporting(false);
        setImportProgress(0);
        return;
      }

      const setoresImport = Array.from(new Set(rows.map(r => r.setor_id)));
      const competenciasImport = Array.from(new Set(rows.map(r => r.data_producao)));
      const existingSet = new Set<string>();
      if (setoresImport.length && competenciasImport.length) {
        const { data: existentes } = await supabase
          .from('concremrh_producao_setor')
          .select('setor_id,data_producao')
          .in('setor_id', setoresImport)
          .in('data_producao', competenciasImport);
        for (const e of (existentes || []) as any[]) existingSet.add(`${e.setor_id}|${e.data_producao}`);
      }
      const toInsert = rows.filter(r => !existingSet.has(`${r.setor_id}|${r.data_producao}`));
      const skipped = rawRows.filter(r => existingSet.has(`${r.setor_id}|${r.competencia}`));
      setSkippedRows(skipped.map(s => ({ ...s, setor_nome: setores.find(st => st.id === s.setor_id)?.nome || s.setor_nome })));

      let success = 0;
      const chunkSize = 200;
      if (toInsert.length === 0) setImportProgress(100);
      for (let i = 0; i < toInsert.length; i += chunkSize) {
        const chunk = toInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from('concremrh_producao_setor').insert(chunk);
        if (!error) success += chunk.length;
        setImportProgress(Math.round(((i + chunk.length) / toInsert.length) * 100));
      }

      toast({
        title: "Importação concluída",
        description: `${success} inserido(s), ${skipped.length} ignorado(s), ${invalid.length} inválido(s)`,
      });
      setInsertedCount(success);
      setIsImporting(false);
      setImportProgress(0);
      refetch();
    } catch (e: any) {
      setIsImporting(false);
      setImportProgress(0);
      toast({ title: "Erro na importação", description: e?.message || "Falha ao importar arquivo", variant: "destructive" });
    }
  };

  const handleDeleteByCompetencia = async () => {
    if (!competenciaDelete) return;
    const iso = `${competenciaDelete}-01`;
    const { error } = await supabase
      .from('concremrh_producao_setor')
      .delete()
      .eq('data_producao', formatDateToBrasilia(iso));
    if (!error) {
      toast({ title: "Registros removidos", description: `Competência ${competenciaDelete}` });
      refetch();
    } else {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    }
  };

  if (setoresLoading || registrosLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando dados...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Produção por Setor"
        description="Metas e produção realizada por setor."
      />

      {/* Novo Registro */}
      <SectionCard
        title={`${editingRecord ? "Editar" : "Registrar"} Produção por Setor`}
        description={editingRecord ? "Edite o registro selecionado" : "Registre a meta e produção realizada por setor"}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Setor *</label>
              <Select value={setorSelecionado} onValueChange={setSetorSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o setor" />
                </SelectTrigger>
                <SelectContent>
                  {setores.filter(s => s.ativo).map(setor => (
                    <SelectItem key={setor.id} value={setor.id}>
                      {setor.nome} {setor.empresa && `- ${setor.empresa.nome}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Competência *</label>
              <Input
                type="month"
                value={dataProducao}
                onChange={(e) => setDataProducao(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Unidade de Medida</label>
              <Select value={unidadeMedida} onValueChange={setUnidadeMedida}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unidades">Unidades</SelectItem>
                  <SelectItem value="pecas">Peças</SelectItem>
                  <SelectItem value="kg">Quilogramas</SelectItem>
                  <SelectItem value="toneladas">Toneladas</SelectItem>
                  <SelectItem value="metros">Metros</SelectItem>
                  <SelectItem value="litros">Litros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Meta Mensal *</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 30000"
                value={metaDiaria}
                onChange={(e) => setMetaDiaria(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Produção Realizada *</label>
              <Input
                type="number"
                step="0.01"
                placeholder="Ex: 1050"
                value={producaoRealizada}
                onChange={(e) => setProducaoRealizada(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Observações</label>
              <Input
                placeholder="Observações opcionais..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </div>
          </div>

          {/* Prévia do cálculo */}
          {metaDiaria && producaoRealizada && (
            <div className="p-4 bg-accent/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Percentual Realizado:</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(calcularPercentual(Number(producaoRealizada), Number(metaDiaria)))}
                  <span className={cn(
                    "text-lg font-bold",
                    getStatusColor(calcularPercentual(Number(producaoRealizada), Number(metaDiaria)))
                  )}>
                    {calcularPercentual(Number(producaoRealizada), Number(metaDiaria))}%
                  </span>
                </div>
              </div>
              <Progress 
                value={Math.min(calcularPercentual(Number(producaoRealizada), Number(metaDiaria)), 100)} 
                className="mt-2"
              />
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
            <Button 
              className="gap-2" 
              onClick={handleSave}
              disabled={!setorSelecionado || !dataProducao || !metaDiaria || !producaoRealizada}
            >
              <Plus className="h-4 w-4" />
              {editingRecord ? "Atualizar" : "Adicionar"} Registro
            </Button>
          </div>
        </div>
      </SectionCard>

      {/* Dados de Produção */}
      <SectionCard
        title="Produção por Setor"
        description="Histórico de metas e realizações por setor"
        actions={
            <Dialog
              open={importOpen}
              onOpenChange={(v) => {
                if (isImporting) return;
                setImportOpen(v);
                if (v) {
                  setImportFile(null);
                  setSkippedRows([]);
                  setInsertedCount(0);
                  setInvalidRows([]);
                  setCompetenciaDelete("");
                  setImportProgress(0);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UploadCloud className="h-4 w-4" />
                  Importar Excel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Importar Produção por Setor</DialogTitle>
                  <DialogDescription>Baixe o template, preencha a competência (YYYY-MM), meta mensal e produção realizada, depois importe.</DialogDescription>
                </DialogHeader>
                {isImporting ? (
                  <div className="space-y-4">
                    <Progress value={importProgress} />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button variant="outline" className="gap-2" onClick={downloadTemplate}>
                      <Download className="h-4 w-4" />
                      Baixar Template
                    </Button>
                    <Input type="file" accept=".xlsx,.xls" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
                    {skippedRows.length > 0 && (
                      <div className="text-sm text-muted-foreground max-h-32 overflow-auto">
                        Ignorados: {skippedRows.length}
                        <ul>
                          {skippedRows.slice(0, 50).map((s, idx) => (
                            <li key={idx}>{s.setor_nome} - {s.competencia}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {invalidRows.length > 0 && (
                      <div className="text-sm text-destructive max-h-32 overflow-auto">
                        Inválidos: {invalidRows.length}
                        <ul>
                          {invalidRows.slice(0, 50).map((s, idx) => (
                            <li key={idx}>
                              Linha {s.linha}: {s.setor_nome || "Sem setor"} ({s.competencia || "Sem competência"}) -{" "}
                              {s.motivo}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insertedCount > 0 && (
                      <div className="text-sm">Inseridos: {insertedCount}</div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Competência</label>
                        <Input type="month" value={competenciaDelete} onChange={(e) => setCompetenciaDelete(e.target.value)} />
                      </div>
                      <div className="flex items-end">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" className="text-destructive hover:text-destructive" disabled={!competenciaDelete}>Apagar por competência</Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remover registros</AlertDialogTitle>
                              <AlertDialogDescription>Esta ação removerá todos os registros da competência selecionada. Deseja continuar?</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteByCompetencia}>Confirmar</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setImportOpen(false)} disabled={isImporting}>Cancelar</Button>
                  <Button className="gap-2" onClick={handleImport} disabled={!importFile || isImporting}>
                    <UploadCloud className="h-4 w-4" />
                    Importar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        }
      >
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex items-end gap-4">
            <div className="relative w-[300px]">
              <Search className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar por setor ou período..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Select value={setorFilter} onValueChange={(v) => setSetorFilter(v === 'all' ? '' : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os setores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os setores</SelectItem>
                  {setores.filter(s => s.ativo).map(setor => (
                    <SelectItem key={setor.id} value={setor.id}>
                      {setor.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Select value={competenciaFilter} onValueChange={setCompetenciaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as competências" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as competências</SelectItem>
                  {competenciasDisponiveis.map((competencia) => (
                    <SelectItem key={competencia} value={competencia}>
                      {competencia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tabela */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Setor</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead className="text-right">Meta</TableHead>
                  <TableHead className="text-right">Realizado</TableHead>
                  <TableHead>Percentual</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistros.map((item) => {
                  const percentual = calcularPercentual(item.producao_realizada, item.meta_diaria);
                  return (
                    <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        {item.setor?.nome || "Setor não encontrado"}
                        {item.setor?.empresa && (
                          <div className="text-xs text-muted-foreground">
                            {item.setor.empresa.nome}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDateToBrazilian(item.data_producao)}
                      </TableCell>
                      <TableCell className="text-right">{formatNumber(item.meta_diaria)}</TableCell>
                      <TableCell className="text-right">{formatNumber(item.producao_realizada)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(percentual)}
                          <span className={cn("font-medium", getStatusColor(percentual))}>
                            {percentual}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Progress 
                            value={Math.min(percentual, 100)} 
                            className="h-2"
                          />
                          <div className="text-xs text-muted-foreground">
                            {percentual >= 100 ? "Meta superada" : 
                             percentual >= 90 ? "Próximo da meta" : 
                             "Abaixo da meta"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {item.unidade_medida}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(item)}
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
                                  Tem certeza que deseja excluir este registro? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(item.id)}
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

          {/* Resumo */}
          {registros.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-2xl font-bold text-success">
                  {registros.filter(r => calcularPercentual(r.producao_realizada, r.meta_diaria) >= 100).length}
                </div>
                <div className="text-sm text-muted-foreground">Registros acima da meta</div>
              </div>
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-2xl font-bold text-status-warning">
                  {registros.filter(r => {
                    const perc = calcularPercentual(r.producao_realizada, r.meta_diaria);
                    return perc >= 90 && perc < 100;
                  }).length}
                </div>
                <div className="text-sm text-muted-foreground">Registros próximos da meta</div>
              </div>
              <div className="text-center p-4 bg-accent/50 rounded-lg">
                <div className="text-2xl font-bold text-destructive">
                  {registros.filter(r => calcularPercentual(r.producao_realizada, r.meta_diaria) < 90).length}
                </div>
                <div className="text-sm text-muted-foreground">Registros abaixo da meta</div>
              </div>
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
};
