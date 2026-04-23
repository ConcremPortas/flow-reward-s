// Página de gestão de funcionários - v2.0
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
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
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Eye, Edit, FileText, Users, Trash2, UploadCloud, Download, Check, ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useEmpresas } from "@/hooks/useEmpresas";
import { useSetores } from "@/hooks/useSetores";
import { useFuncoes } from "@/hooks/useFuncoes";
import { useCategorias } from "@/hooks/useCategorias";
import { useBasePremiacao } from "@/hooks/useBasePremiacao";
import { useFaixas } from "@/hooks/useFaixas";
import { useLocaisDSS } from "@/hooks/useLocaisDSS";

export const Funcionarios = () => {
  // Componente de gestão de funcionários conectado ao banco de dados
  const { funcionarios, loading, createFuncionario, updateFuncionario, deleteFuncionario, refetch } = useFuncionarios();
  const { empresas } = useEmpresas();
  const { setores } = useSetores();
  const { funcoes } = useFuncoes();
  const { categorias } = useCategorias();
  const { bases } = useBasePremiacao();
  const { faixas } = useFaixas();
  const { locais: locaisDSS } = useLocaisDSS();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSetor, setSelectedSetor] = useState("Todos");
  const [selectedStatus, setSelectedStatus] = useState("Todos");
  const [selectedCategoria, setSelectedCategoria] = useState("Todos");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [skippedRows, setSkippedRows] = useState<{ campo: string; valor: string; motivo: string }[]>([]);
  const [insertedCount, setInsertedCount] = useState(0);
  const { toast } = useToast();
  const [setorDropdownOpen, setSetorDropdownOpen] = useState(false);
  const [setorSearchTerm, setSetorSearchTerm] = useState("");
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedFuncionario, setSelectedFuncionario] = useState<any>(null);
  const [formData, setFormData] = useState({
    cod_funcionario: "",
    nome: "",
    empresa_id: "",
    setor_id: "",
    funcao_id: "",
    categoria_id: "",
    base_premiacao_id: "",
    faixa_id: "",
    local_dss_id: "",
    data_admissao: "",
    status: "Ativo",
    valor_fixo: "",
    setor_ids: [] as string[]
  });

  const filteredFuncionarios = funcionarios.filter(funcionario => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      funcionario.nome.toLowerCase().includes(term) ||
      (funcionario.cpf || '').toLowerCase().includes(term) ||
      (funcionario.setor?.nome || '').toLowerCase().includes(term) ||
      (funcionario.categoria?.nome || '').toLowerCase().includes(term);
    const matchesSetor = selectedSetor === "Todos" || funcionario.setor?.nome === selectedSetor;
    const matchesStatus = selectedStatus === "Todos" || funcionario.status === selectedStatus;
    const matchesCategoria = selectedCategoria === "Todos" || funcionario.categoria?.nome === selectedCategoria;

    return matchesSearch && matchesSetor && matchesStatus && matchesCategoria;
  });

  const formatCurrency = (value?: number) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleAdd = () => {
    setFormData({
      cod_funcionario: "",
      nome: "",
      empresa_id: "",
      setor_id: "",
      funcao_id: "",
      categoria_id: "",
      base_premiacao_id: "",
      faixa_id: "",
      local_dss_id: "",
      data_admissao: "",
      status: "Ativo",
      valor_fixo: "",
      setor_ids: []
    });
    setIsAddOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome.trim()) return;
    
    const funcionarioData = {
      nome: formData.nome.trim(),
      cpf: formData.cod_funcionario.trim() || undefined,
      data_admissao: formData.data_admissao || undefined,
      empresa_id: formData.empresa_id || undefined,
      setor_id: formData.setor_ids[0] || undefined,
      funcao_id: formData.funcao_id || undefined,
      categoria_id: formData.categoria_id || undefined,
      base_premiacao_id: formData.base_premiacao_id || undefined,
      faixa_id: formData.faixa_id || undefined,
      local_dss_id: formData.local_dss_id || undefined,
      status: formData.status,
      valor_fixo: parseFloat(formData.valor_fixo) || undefined,
      ativo: true
    };

    const novoFuncionario = await createFuncionario(funcionarioData);
    if (novoFuncionario?.id && formData.setor_ids.length > 0) {
      await supabase.rpc('update_funcionario_setor_ids', {
        p_id: novoFuncionario.id,
        p_setor_ids: formData.setor_ids.join(',')
      });
    }

    setIsAddOpen(false);
    setFormData({
      cod_funcionario: "",
      nome: "",
      empresa_id: "",
      setor_id: "",
      funcao_id: "",
      categoria_id: "",
      base_premiacao_id: "",
      faixa_id: "",
      local_dss_id: "",
      data_admissao: "",
      status: "Ativo",
      valor_fixo: "",
      setor_ids: []
    });
  };

  const handleView = (funcionario: any) => {
    setSelectedFuncionario(funcionario);
    setIsViewOpen(true);
  };

  const handleEdit = (funcionario: any) => {
    setSelectedFuncionario(funcionario);
    setFormData({
      cod_funcionario: funcionario.cpf || "",
      nome: funcionario.nome,
      data_admissao: funcionario.data_admissao || "",
      empresa_id: funcionario.empresa_id || "",
      setor_id: funcionario.setor_id || "",
      funcao_id: funcionario.funcao_id || "",
      categoria_id: funcionario.categoria_id || "",
      base_premiacao_id: funcionario.base_premiacao_id || "",
      faixa_id: funcionario.faixa_id || "",
      local_dss_id: funcionario.local_dss_id || "",
      status: funcionario.status || "Ativo",
      valor_fixo: String(funcionario.valor_fixo || ""),
      setor_ids: funcionario.setor_ids && funcionario.setor_ids.length > 0
        ? funcionario.setor_ids
        : (funcionario.setor_id ? [funcionario.setor_id] : [])
    });
    setSetorDropdownOpen(false);
    setSetorSearchTerm("");
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!formData.nome.trim() || !selectedFuncionario) return;
    
    const updateData = {
      nome: formData.nome.trim(),
      cpf: formData.cod_funcionario.trim() || undefined,
      data_admissao: formData.data_admissao || undefined,
      empresa_id: formData.empresa_id || undefined,
      setor_id: formData.setor_ids[0] || undefined,
      funcao_id: formData.funcao_id || undefined,
      categoria_id: formData.categoria_id || undefined,
      base_premiacao_id: formData.base_premiacao_id || undefined,
      faixa_id: formData.faixa_id || undefined,
      local_dss_id: formData.local_dss_id || undefined,
      status: formData.status,
      valor_fixo: parseFloat(formData.valor_fixo) || undefined,
      ativo: formData.status.toLowerCase() !== 'rescisão' && formData.status.toLowerCase() !== 'rescisao',
    };

    await updateFuncionario(selectedFuncionario.id, updateData);
    await supabase.rpc('update_funcionario_setor_ids', {
      p_id: selectedFuncionario.id,
      p_setor_ids: formData.setor_ids.length > 0 ? formData.setor_ids.join(',') : ''
    });

    setIsEditOpen(false);
    setSelectedFuncionario(null);
  };

  const handleDelete = async (funcionario: any) => {
    await deleteFuncionario(funcionario.id);
  };

  const downloadTemplate = () => {
    const rows = [
      {
        empresa_nome: empresas[0]?.nome || "",
        cod_funcionario: "0001",
        nome: "Fulano de Tal",
        data_admissao: "2025-01-15",
        setor_nome: setores[0]?.nome || "",
        funcao_nome: funcoes[0]?.nome || "",
        categoria_nome: categorias[0]?.nome || "",
        base_premiacao_nome: bases[0]?.nome || "",
        faixa_nome: faixas[0]?.nome || "",
        local_dss_nome: locaisDSS[0]?.nome || "",
        status: "Ativo",
      },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Funcionarios");
    const maxLen = Math.max(
      empresas.length,
      setores.length,
      funcoes.length,
      categorias.length,
      bases.length,
      faixas.length,
      locaisDSS.length
    );
    const refsRows = Array.from({ length: maxLen }).map((_, i) => ({
      Empresas: empresas[i]?.nome || "",
      Setores: setores[i]?.nome || "",
      Funcoes: funcoes[i]?.nome || "",
      Categorias: categorias[i]?.nome || "",
      Bases: bases[i]?.nome || "",
      Faixas: faixas[i]?.nome || "",
      LocaisDSS: locaisDSS[i]?.nome || "",
    }));
    const refs = XLSX.utils.json_to_sheet(refsRows);
    XLSX.utils.book_append_sheet(wb, refs, "Referencias");
    XLSX.writeFile(wb, "template_funcionarios.xlsx");
  };

  const mapByNome = (lista: any[]) => {
    const m = new Map<string, string>();
    lista.forEach((i) => m.set(normalize(i.nome), i.id));
    return m;
  };

  const normalizeKey = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w]+/g, "_")
      .replace(/^_+|_+$/g, "");

  const parseDateISO = (value: unknown) => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      const y = value.getFullYear();
      const m = String(value.getMonth() + 1).padStart(2, "0");
      const d = String(value.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    if (typeof value === "number") {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed?.y && parsed?.m && parsed?.d) {
        const y = String(parsed.y).padStart(4, "0");
        const m = String(parsed.m).padStart(2, "0");
        const d = String(parsed.d).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    }
    const str = String(value).trim();
    if (!str) return null;
    const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const br = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (br) return `${br[3]}-${br[2]}-${br[1]}`;
    return null;
  };

  const handleImport = async () => {
    if (!importFile) return;
    try {
      setIsImporting(true);
      setImportProgress(0);
      setSkippedRows([]);
      setInsertedCount(0);
      const buffer = await importFile.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array", cellDates: true });
      // Tentar encontrar a aba "Funcionarios" ou usar a primeira
      const sheetName = wb.SheetNames.find(n => n.toLowerCase().includes('func') || n.toLowerCase().includes('func')) || wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (data.length === 0) {
        toast({
          title: "Arquivo vazio",
          description: `Abas encontradas: ${wb.SheetNames.join(', ')}. Aba lida: "${sheetName}". Verifique se os dados estão na aba correta e se a linha de cabeçalho está presente.`,
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      const rows: any[] = [];
      const rawKeys: { empresa_id: string; cod_funcionario: string }[] = [];
      const skipped: { campo: string; valor: string; motivo: string }[] = [];

      const { data: empresasAll } = await supabase
        .from('concremrh_empresas')
        .select('id,nome')
        .order('nome');

      const empresasMap = mapByNome((empresasAll && empresasAll.length ? empresasAll : empresas) as any[]);
      const empresasIdSet = new Set(((empresasAll && empresasAll.length ? empresasAll : empresas) as any[]).map((e) => e.id));
      const setoresMap = mapByNome(setores);
      const funcoesMap = mapByNome(funcoes);
      const categoriasMap = mapByNome(categorias);
      const basesMap = mapByNome(bases);
      const faixasMap = mapByNome(faixas);
      const locaisMap = mapByNome(locaisDSS);
      for (const row of data as any[]) {
        const normalizedRow: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row as Record<string, unknown>)) {
          normalizedRow[normalizeKey(k)] = v;
        }

        const empresaIdFromFile = String(normalizedRow.empresa_id || "").trim();
        const empresaNome = String(
          normalizedRow.empresa_nome ||
            normalizedRow.empresa ||
            normalizedRow.nome_empresa ||
            normalizedRow.empresas ||
            "",
        ).trim();

        const empresaId =
          (empresaIdFromFile && empresasIdSet.has(empresaIdFromFile) ? empresaIdFromFile : undefined) ||
          (empresaNome ? empresasMap.get(normalize(empresaNome)) : undefined);

        const cod = String(
          normalizedRow.cod_funcionario ||
            normalizedRow.codigo_funcionario ||
            normalizedRow.codigo ||
            normalizedRow.matricula ||
            normalizedRow.cpf ||
            normalizedRow.cod ||
            "",
        ).trim();

        const nome = String(normalizedRow.nome || normalizedRow.nome_funcionario || normalizedRow.funcionario || "").trim();
        const dataAdm = parseDateISO(normalizedRow.data_admissao || normalizedRow.admissao || normalizedRow.data_de_admissao);

        const setorNome = String(normalizedRow.setor_nome || normalizedRow.setor || "").trim();
        const funcaoNome = String(normalizedRow.funcao_nome || normalizedRow.funcao || normalizedRow.cargo || "").trim();
        const categoriaNome = String(normalizedRow.categoria_nome || normalizedRow.categoria || "").trim();
        const baseNome = String(
          normalizedRow.base_premiacao_nome || normalizedRow.base_premiacao || normalizedRow.base || "",
        ).trim();
        const faixaNome = String(normalizedRow.faixa_nome || normalizedRow.faixa || "").trim();
        const localNome = String(normalizedRow.local_dss_nome || normalizedRow.local_dss || normalizedRow.local || "").trim();

        const setorId = String(normalizedRow.setor_id || "").trim() || (setorNome ? setoresMap.get(normalize(setorNome)) : undefined);
        const funcaoId =
          String(normalizedRow.funcao_id || "").trim() || (funcaoNome ? funcoesMap.get(normalize(funcaoNome)) : undefined);
        const categoriaId =
          String(normalizedRow.categoria_id || "").trim() ||
          (categoriaNome ? categoriasMap.get(normalize(categoriaNome)) : undefined);
        const baseId =
          String(normalizedRow.base_premiacao_id || "").trim() || (baseNome ? basesMap.get(normalize(baseNome)) : undefined);
        const faixaId = String(normalizedRow.faixa_id || "").trim() || (faixaNome ? faixasMap.get(normalize(faixaNome)) : undefined);
        const localDssId =
          String(normalizedRow.local_dss_id || "").trim() || (localNome ? locaisMap.get(normalize(localNome)) : undefined);

        const status = String(normalizedRow.status || normalizedRow.status_funcional || "Ativo").trim() || "Ativo";

        if (!empresaId) { skipped.push({ campo: "empresa_nome", valor: empresaNome, motivo: "Empresa não cadastrada" }); continue; }
        if (!cod) { skipped.push({ campo: "cod_funcionario", valor: "", motivo: "Código obrigatório" }); continue; }
        if (!nome) { skipped.push({ campo: "nome", valor: "", motivo: "Nome obrigatório" }); continue; }
        if (setorNome && !setorId) { skipped.push({ campo: "setor_nome", valor: setorNome, motivo: "Setor não cadastrado" }); continue; }
        if (funcaoNome && !funcaoId) { skipped.push({ campo: "funcao_nome", valor: funcaoNome, motivo: "Função não cadastrada" }); continue; }
        if (categoriaNome && !categoriaId) { skipped.push({ campo: "categoria_nome", valor: categoriaNome, motivo: "Categoria não cadastrada" }); continue; }
        if (baseNome && !baseId) { skipped.push({ campo: "base_premiacao_nome", valor: baseNome, motivo: "Base de premiação não cadastrada" }); continue; }
        if (faixaNome && !faixaId) { skipped.push({ campo: "faixa_nome", valor: faixaNome, motivo: "Faixa não cadastrada" }); continue; }
        if (localNome && !localDssId) { skipped.push({ campo: "local_dss_nome", valor: localNome, motivo: "Local DSS não cadastrado" }); continue; }

        rows.push({
          nome,
          cpf: cod,
          data_admissao: dataAdm || null,
          empresa_id: empresaId,
          setor_id: setorId || null,
          funcao_id: funcaoId || null,
          categoria_id: categoriaId || null,
          base_premiacao_id: baseId || null,
          faixa_id: faixaId || null,
          local_dss_id: localDssId || null,
          status,
          ativo: true,
        });

        rawKeys.push({ empresa_id: empresaId, cod_funcionario: cod });
      }

      if (rows.length === 0) {
        setSkippedRows(skipped);
        toast({
          title: "Nenhuma linha válida",
          description: skipped.length
            ? `Arquivo lido, mas ${skipped.length} linha(s) foram ignoradas. Confira a lista.`
            : "Arquivo lido, mas nenhuma linha foi reconhecida. Confira o template.",
          variant: "destructive",
        });
        setIsImporting(false);
        setImportProgress(0);
        return;
      }

      // Verificar duplicados existentes no banco por cpf
      const codsImport = Array.from(new Set(rows.map((r) => r.cpf).filter(Boolean)));
      let existentes: any[] = [];
      if (codsImport.length) {
        const { data } = await supabase
          .from("concremrh_funcionarios")
          .select("cpf")
          .in("cpf", codsImport as string[]);
        existentes = (data || []) as any[];
      }
      const existSet = new Set((existentes || []).map((e: any) => e.cpf));

      // Deduplificar dentro do próprio arquivo (manter primeiro de cada cpf)
      const seenCpfs = new Set<string>();
      const toInsert: any[] = [];
      for (const r of rows) {
        if (seenCpfs.has(r.cpf)) {
          skipped.push({ campo: "duplicado", valor: r.cpf, motivo: "Código duplicado no arquivo" });
        } else if (existSet.has(r.cpf)) {
          skipped.push({ campo: "duplicado", valor: r.cpf, motivo: "Código já existente no banco" });
          seenCpfs.add(r.cpf);
        } else {
          seenCpfs.add(r.cpf);
          toInsert.push(r);
        }
      }

      let success = 0;
      if (toInsert.length === 0) setImportProgress(100);
      // Inserir um por um para não perder todos por causa de um erro
      for (let i = 0; i < toInsert.length; i++) {
        const { error } = await supabase.from("concremrh_funcionarios").insert(toInsert[i]);
        if (error) {
          skipped.push({ campo: "erro_insert", valor: toInsert[i].cpf || "", motivo: error.message });
        } else {
          success++;
        }
        if (i % 10 === 0) setImportProgress(Math.round(((i + 1) / toInsert.length) * 100));
      }

      setInsertedCount(success);
      setSkippedRows(skipped);
      toast({
        title: "Importação concluída",
        description: `${success} inserido(s), ${skipped.length} ignorado(s)`,
      });
      setIsImporting(false);
      setImportProgress(0);
      setImportFile(null);
      refetch();
    } catch (e: any) {
      setIsImporting(false);
      setImportProgress(0);
      toast({ title: "Erro na importação", description: e?.message || "Falha ao importar arquivo", variant: "destructive" });
    }
  };

  const setorOptions = ["Todos", ...setores.map(s => s.nome)];
  const statusOptions = ["Todos", "Ativo", "Férias", "Licença", "Rescisão"];
  const categoriaOptions = ["Todos", ...categorias.map(c => c.nome)];
  const funcionarioStatusOptions = ["Ativo", "Férias", "Licença", "Rescisão"];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Carregando funcionários...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card Informativo */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Vinculação de Setor</h3>
              <p className="text-sm text-muted-foreground">
                O setor do funcionário é fundamental para o cálculo da premiação. Para funcionários auxiliares, 
                a meta de produção do setor será utilizada como base para calcular a nota geral da premiação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="card-elegant">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Gestão de Funcionários</CardTitle>
              <CardDescription>
                Cadastro e controle de funcionários do sistema
              </CardDescription>
            </div>
            <div className="flex gap-2">
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2" onClick={handleAdd}>
                  <Plus className="h-4 w-4" />
                  Novo Funcionário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Novo Funcionário</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="cod_funcionario">Cód. Funcionário *</Label>
                    <Input
                      id="cod_funcionario"
                      value={formData.cod_funcionario}
                      onChange={(e) => setFormData({...formData, cod_funcionario: e.target.value})}
                      placeholder="Código do funcionário"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome do Funcionário *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                      placeholder="Nome completo"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="data_admissao">Data de Admissão</Label>
                    <Input
                      id="data_admissao"
                      type="date"
                      value={formData.data_admissao}
                      onChange={(e) => setFormData({...formData, data_admissao: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="empresa">Empresa *</Label>
                    <Select value={formData.empresa_id} onValueChange={(value) => setFormData({...formData, empresa_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {empresas.map(empresa => (
                          <SelectItem key={empresa.id} value={empresa.id}>
                            {empresa.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Setor</Label>
                    <Popover open={setorDropdownOpen} onOpenChange={setSetorDropdownOpen}>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-between font-normal h-9">
                          <span className="truncate text-left">
                            {formData.setor_ids.length > 0
                              ? formData.setor_ids.map(id => setores.find(s => s.id === id)?.nome).filter(Boolean).join(', ')
                              : <span className="text-muted-foreground">Selecionar setor</span>}
                          </span>
                          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-0" align="start">
                        <div className="p-2 border-b">
                          <Input
                            placeholder="Buscar setor..."
                            value={setorSearchTerm}
                            onChange={(e) => setSetorSearchTerm(e.target.value)}
                            className="h-8"
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {setores
                            .filter(s => !setorSearchTerm || s.nome.toLowerCase().includes(setorSearchTerm.toLowerCase()))
                            .map(setor => {
                              const selected = formData.setor_ids.includes(setor.id);
                              return (
                                <div
                                  key={setor.id}
                                  className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent text-sm ${selected ? 'bg-accent/30' : ''}`}
                                  onClick={() => {
                                    const ids = formData.setor_ids;
                                    setFormData({...formData, setor_ids: selected ? ids.filter(id => id !== setor.id) : [...ids, setor.id]});
                                  }}
                                >
                                  <Check className={`h-4 w-4 shrink-0 ${selected ? 'opacity-100' : 'opacity-0'}`} />
                                  {setor.nome}
                                </div>
                              );
                            })}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="funcao">Função *</Label>
                    <Select value={formData.funcao_id} onValueChange={(value) => setFormData({...formData, funcao_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar função" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcoes.map(funcao => (
                          <SelectItem key={funcao.id} value={funcao.id}>
                            {funcao.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="categoria">Categoria *</Label>
                    <Select value={formData.categoria_id} onValueChange={(value) => setFormData({...formData, categoria_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map(categoria => (
                          <SelectItem key={categoria.id} value={categoria.id}>
                            {categoria.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="base_premiacao">Base Premiação *</Label>
                    <Select value={formData.base_premiacao_id} onValueChange={(value) => setFormData({...formData, base_premiacao_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar base de premiação" />
                      </SelectTrigger>
                      <SelectContent>
                        {bases.map(base => (
                          <SelectItem key={base.id} value={base.id}>
                            {base.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="faixa">Faixa *</Label>
                    <Select value={formData.faixa_id} onValueChange={(value) => setFormData({...formData, faixa_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar faixa" />
                      </SelectTrigger>
                      <SelectContent>
                        {faixas.map(faixa => (
                          <SelectItem key={faixa.id} value={faixa.id}>
                            {faixa.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="local_dss">Local DSS *</Label>
                    <Select value={formData.local_dss_id} onValueChange={(value) => setFormData({...formData, local_dss_id: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar local DSS" />
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
                    <Label htmlFor="status">Status *</Label>
                    <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar status" />
                      </SelectTrigger>
                      <SelectContent>
                        {funcionarioStatusOptions.map(status => (
                          <SelectItem key={status} value={status}>
                            {status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor_fixo">Valor Fixo (R$)</Label>
                    <Input
                      id="valor_fixo"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0,00"
                      value={formData.valor_fixo}
                      onChange={(e) => setFormData({...formData, valor_fixo: e.target.value})}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={!formData.nome.trim() || !formData.cod_funcionario.trim()}>
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog
              open={isImportOpen}
              onOpenChange={(v) => {
                if (isImporting) return;
                setIsImportOpen(v);
                if (v) {
                  setImportFile(null);
                  setSkippedRows([]);
                  setInsertedCount(0);
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
              <DialogContent className="max-w-xl">
                <DialogHeader>
                  <DialogTitle>Importar Funcionários</DialogTitle>
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
                            <li key={idx}>{s.campo}: {s.valor} ({s.motivo})</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {insertedCount > 0 && (
                      <div className="text-sm">Inseridos: {insertedCount}</div>
                    )}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsImportOpen(false)} disabled={isImporting}>Cancelar</Button>
                  <Button className="gap-2" onClick={handleImport} disabled={!importFile || isImporting}>
                    <UploadCloud className="h-4 w-4" />
                    Importar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
                {setorOptions.map(setor => (
                  <SelectItem key={setor} value={setor}>{setor}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedCategoria} onValueChange={setSelectedCategoria}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoriaOptions.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map(status => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Nome</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Status Funcional</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFuncionarios.map((funcionario) => (
                  <TableRow key={funcionario.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{funcionario.nome}</TableCell>
                    <TableCell>{funcionario.setor?.nome || "Não informado"}</TableCell>
                    <TableCell>{funcionario.funcao?.nome || "Não informado"}</TableCell>
                    <TableCell>{funcionario.categoria?.nome || "Não informado"}</TableCell>
                    <TableCell>{funcionario.empresa?.nome || "Não informado"}</TableCell>
                    <TableCell>
                      <StatusBadge status={funcionario.status === "Ativo" ? "active" : "inactive"} />
                      <span className="ml-2">{funcionario.status || "Ativo"}</span>
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex justify-end space-x-2">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="gap-1"
                           onClick={() => handleView(funcionario)}
                         >
                           <Eye className="h-3 w-3" />
                           Ver
                         </Button>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="gap-1"
                           onClick={() => handleEdit(funcionario)}
                         >
                           <Edit className="h-3 w-3" />
                           Editar
                         </Button>
                         <AlertDialog>
                           <AlertDialogTrigger asChild>
                             <Button 
                               variant="ghost" 
                               size="sm" 
                               className="gap-1 text-destructive hover:text-destructive"
                             >
                               <Trash2 className="h-3 w-3" />
                               Excluir
                             </Button>
                           </AlertDialogTrigger>
                           <AlertDialogContent>
                             <AlertDialogHeader>
                               <AlertDialogTitle>Excluir Funcionário</AlertDialogTitle>
                               <AlertDialogDescription>
                                 Tem certeza que deseja excluir o funcionário "{funcionario.nome}"? 
                                 Esta ação irá desativar o funcionário do sistema.
                               </AlertDialogDescription>
                             </AlertDialogHeader>
                             <AlertDialogFooter>
                               <AlertDialogCancel>Cancelar</AlertDialogCancel>
                               <AlertDialogAction 
                                 onClick={() => handleDelete(funcionario)}
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

          {/* Footer with pagination info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Mostrando {filteredFuncionarios.length} de {funcionarios.length} funcionários
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Visualização */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Funcionário</DialogTitle>
          </DialogHeader>
          {selectedFuncionario && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label className="font-semibold">Nome</Label>
                <p className="text-sm">{selectedFuncionario.nome}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Código Funcionário</Label>
                <p className="text-sm">{selectedFuncionario.cpf || "Não informado"}</p>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Data de Admissão</Label>
                <p className="text-sm">
                  {selectedFuncionario.data_admissao 
                    ? new Date(selectedFuncionario.data_admissao).toLocaleDateString('pt-BR')
                    : "Não informado"
                  }
                </p>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">Status Funcional</Label>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedFuncionario.status === "Ativo" ? "active" : "inactive"} />
                  <p className="text-sm font-medium">{selectedFuncionario.status || "Ativo"}</p>
                </div>
                {selectedFuncionario.status !== "Ativo" && (
                  <p className="text-xs text-muted-foreground">Não participa da premiação</p>
                )}
              </div>
              
              {/* Seção de Vinculação Organizacional */}
              <div className="md:col-span-2 border-t pt-4 mt-4">
                <h4 className="font-semibold text-lg mb-3">Vinculação Organizacional</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">Empresa</Label>
                    <p className="text-sm">{selectedFuncionario.empresa?.nome || "Não informado"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-primary">Setor</Label>
                    <p className="text-sm font-medium">{selectedFuncionario.setor?.nome || "Não informado"}</p>
                    <p className="text-xs text-muted-foreground">Base para cálculo da meta de produção</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Função</Label>
                    <p className="text-sm">{selectedFuncionario.funcao?.nome || "Não informado"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Categoria</Label>
                    <p className="text-sm">{selectedFuncionario.categoria?.nome || "Não informado"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Base Premiação</Label>
                    <p className="text-sm">{selectedFuncionario.base_premiacao?.nome || "Não informado"}</p>
                  </div>
                   <div className="space-y-2">
                    <Label className="font-semibold text-primary">Faixa</Label>
                    <p className="text-sm font-medium">{selectedFuncionario.faixa?.nome || "Não informado"}</p>
                    <p className="text-xs text-muted-foreground">Base para cálculo da premiação (produção)</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold text-primary">Local DSS</Label>
                    <p className="text-sm font-medium">{selectedFuncionario.local_dss?.nome || "Não informado"}</p>
                    <p className="text-xs text-muted-foreground">Vinculação para presença em DSS</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Status</Label>
                    <p className="text-sm font-medium">{selectedFuncionario.status || "Ativo"}</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">Valor Fixo</Label>
                    <p className="text-sm font-medium">
                      {selectedFuncionario.valor_fixo
                        ? formatCurrency(selectedFuncionario.valor_fixo)
                        : "Não informado"}
                    </p>
                  </div>
                  {selectedFuncionario.setor_ids && selectedFuncionario.setor_ids.length > 0 && (
                    <div className="space-y-2 md:col-span-2">
                      <Label className="font-semibold">Setores Vinculados</Label>
                      <p className="text-sm">
                        {selectedFuncionario.setor_ids
                          .map((id: string) => setores.find(s => s.id === id)?.nome || id)
                          .join(', ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Funcionário</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit_cod_funcionario">Cód. Funcionário *</Label>
              <Input
                id="edit_cod_funcionario"
                value={formData.cod_funcionario}
                onChange={(e) => setFormData({...formData, cod_funcionario: e.target.value})}
                placeholder="Código do funcionário"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_nome">Nome *</Label>
              <Input
                id="edit_nome"
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value})}
                placeholder="Nome completo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_data_admissao">Data de Admissão</Label>
              <Input
                id="edit_data_admissao"
                type="date"
                value={formData.data_admissao}
                onChange={(e) => setFormData({...formData, data_admissao: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_empresa">Empresa</Label>
              <Select value={formData.empresa_id} onValueChange={(value) => setFormData({...formData, empresa_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  {empresas.map(empresa => (
                    <SelectItem key={empresa.id} value={empresa.id}>
                      {empresa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Setor</Label>
              <Popover open={setorDropdownOpen} onOpenChange={setSetorDropdownOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal h-9">
                    <span className="truncate text-left">
                      {formData.setor_ids.length > 0
                        ? formData.setor_ids.map(id => setores.find(s => s.id === id)?.nome).filter(Boolean).join(', ')
                        : <span className="text-muted-foreground">Selecionar setor</span>}
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0" align="start">
                  <div className="p-2 border-b">
                    <Input
                      placeholder="Buscar setor..."
                      value={setorSearchTerm}
                      onChange={(e) => setSetorSearchTerm(e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {setores
                      .filter(s => !setorSearchTerm || s.nome.toLowerCase().includes(setorSearchTerm.toLowerCase()))
                      .map(setor => {
                        const selected = formData.setor_ids.includes(setor.id);
                        return (
                          <div
                            key={setor.id}
                            className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent text-sm ${selected ? 'bg-accent/30' : ''}`}
                            onClick={() => {
                              const ids = formData.setor_ids;
                              setFormData({...formData, setor_ids: selected ? ids.filter(id => id !== setor.id) : [...ids, setor.id]});
                            }}
                          >
                            <Check className={`h-4 w-4 shrink-0 ${selected ? 'opacity-100' : 'opacity-0'}`} />
                            {setor.nome}
                          </div>
                        );
                      })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_funcao">Função</Label>
              <Select value={formData.funcao_id} onValueChange={(value) => setFormData({...formData, funcao_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar função" />
                </SelectTrigger>
                <SelectContent>
                  {funcoes.map(funcao => (
                    <SelectItem key={funcao.id} value={funcao.id}>
                      {funcao.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_categoria">Categoria</Label>
              <Select value={formData.categoria_id} onValueChange={(value) => setFormData({...formData, categoria_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.map(categoria => (
                    <SelectItem key={categoria.id} value={categoria.id}>
                      {categoria.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_base_premiacao">Base Premiação</Label>
              <Select value={formData.base_premiacao_id} onValueChange={(value) => setFormData({...formData, base_premiacao_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar base de premiação" />
                </SelectTrigger>
                <SelectContent>
                  {bases.map(base => (
                    <SelectItem key={base.id} value={base.id}>
                      {base.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_faixa">Faixa</Label>
              <Select value={formData.faixa_id} onValueChange={(value) => setFormData({...formData, faixa_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar faixa" />
                </SelectTrigger>
                <SelectContent>
                  {faixas.map(faixa => (
                    <SelectItem key={faixa.id} value={faixa.id}>
                      {faixa.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_local_dss">Local DSS</Label>
              <Select value={formData.local_dss_id} onValueChange={(value) => setFormData({...formData, local_dss_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar local DSS" />
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
              <Label htmlFor="edit_status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  {funcionarioStatusOptions.map(status => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_valor_fixo">Valor Fixo (R$)</Label>
              <Input
                id="edit_valor_fixo"
                type="number"
                min="0"
                step="0.01"
                placeholder="0,00"
                value={formData.valor_fixo}
                onChange={(e) => setFormData({...formData, valor_fixo: e.target.value})}
              />
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.nome.trim() || !formData.cod_funcionario.trim()}>
              Atualizar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
  const normalize = (s?: string) =>
    (s || "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s]+/g, " ")
      .replace(/\s+/g, " ")
      .toUpperCase();
