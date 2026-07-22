import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Empresa } from '@/hooks/useEmpresas';
import type { Setor } from '@/hooks/useSetores';
import type { Funcao } from '@/hooks/useFuncoes';
import type { Categoria } from '@/hooks/useCategorias';
import type { BasePremiacao } from '@/hooks/useBasePremiacao';
import type { Faixa } from '@/hooks/useFaixas';
import type { LocalDSS } from '@/hooks/useLocaisDSS';
import type { ImportPreviewRow, ImportSummary, ImportInsertPayload } from '../types';

export type ImportStep = 'arquivo' | 'validacao' | 'confirmacao';

interface RefData {
  empresas: Empresa[]; setores: Setor[]; funcoes: Funcao[]; categorias: Categoria[];
  bases: BasePremiacao[]; faixas: Faixa[]; locaisDSS: LocalDSS[];
}

const normalize = (s?: string) =>
  (s || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]+/g, ' ').replace(/\s+/g, ' ').toUpperCase();

const normalizeKey = (value: string) =>
  value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '');

const parseDateISO = (value: unknown): string | null => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getFullYear(), m = String(value.getMonth() + 1).padStart(2, '0'), d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed?.y && parsed?.m && parsed?.d) {
      return `${String(parsed.y).padStart(4, '0')}-${String(parsed.m).padStart(2, '0')}-${String(parsed.d).padStart(2, '0')}`;
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

const mapByNome = (lista: { id: string; nome: string }[]) => {
  const m = new Map<string, string>();
  lista.forEach((i) => m.set(normalize(i.nome), i.id));
  return m;
};

/**
 * Importação em 3 etapas: arquivo → validação local (pré-visualização, SEM
 * inserir) → confirmação (insere apenas os válidos). Mesma lógica de
 * parsing/validação/insert do fluxo anterior — só reorganizada em etapas.
 * Limitação real: a validação de "duplicado no banco" e o insert em si
 * dependem de chamadas ao Supabase (não há como pré-visualizar 100% offline);
 * o restante (formato, campos obrigatórios, referências) é validado no cliente.
 */
export function useEmployeeImport(refs: RefData, refetch: () => void) {
  const { toast } = useToast();
  const [step, setStep] = useState<ImportStep>('arquivo');
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [insertedCount, setInsertedCount] = useState(0);

  const reset = () => {
    setStep('arquivo'); setFile(null); setIsParsing(false); setIsImporting(false);
    setProgress(0); setPreviewRows([]); setInsertedCount(0);
  };

  const downloadTemplate = () => {
    const { empresas, setores, funcoes, categorias, bases, faixas, locaisDSS } = refs;
    const rows = [{
      empresa_nome: empresas[0]?.nome || '', cod_funcionario: '0001', nome: 'Fulano de Tal',
      data_admissao: '2025-01-15', setor_nome: setores[0]?.nome || '', funcao_nome: funcoes[0]?.nome || '',
      categoria_nome: categorias[0]?.nome || '', base_premiacao_nome: bases[0]?.nome || '',
      faixa_nome: faixas[0]?.nome || '', local_dss_nome: locaisDSS[0]?.nome || '', status: 'Ativo',
    }];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Funcionarios');
    const maxLen = Math.max(empresas.length, setores.length, funcoes.length, categorias.length, bases.length, faixas.length, locaisDSS.length);
    const refsRows = Array.from({ length: maxLen }).map((_, i) => ({
      Empresas: empresas[i]?.nome || '', Setores: setores[i]?.nome || '', Funcoes: funcoes[i]?.nome || '',
      Categorias: categorias[i]?.nome || '', Bases: bases[i]?.nome || '', Faixas: faixas[i]?.nome || '', LocaisDSS: locaisDSS[i]?.nome || '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(refsRows), 'Referencias');
    XLSX.writeFile(wb, 'template_funcionarios.xlsx');
  };

  /** Etapa 2 — parseia e valida localmente (sem inserir). */
  const buildPreview = async () => {
    if (!file) return;
    setIsParsing(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      const sheetName = wb.SheetNames.find((n) => n.toLowerCase().includes('func')) || wb.SheetNames[0];
      const ws = wb.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

      if (data.length === 0) {
        toast({ title: 'Arquivo vazio', description: `Abas encontradas: ${wb.SheetNames.join(', ')}. Aba lida: "${sheetName}".`, variant: 'destructive' });
        setIsParsing(false);
        return;
      }

      const { empresas, setores, funcoes, categorias, bases, faixas, locaisDSS } = refs;
      const { data: empresasAll } = await supabase.from('concremrh_empresas').select('id,nome').order('nome');
      const empresasRef = (empresasAll && empresasAll.length ? empresasAll : empresas) as { id: string; nome: string }[];
      const empresasMap = mapByNome(empresasRef);
      const empresasIdSet = new Set(empresasRef.map((e) => e.id));
      const setoresMap = mapByNome(setores);
      const funcoesMap = mapByNome(funcoes);
      const categoriasMap = mapByNome(categorias);
      const basesMap = mapByNome(bases);
      const faixasMap = mapByNome(faixas);
      const locaisMap = mapByNome(locaisDSS);

      const rows: ImportPreviewRow[] = [];
      const codsSeen = new Set<string>();

      (data as Record<string, unknown>[]).forEach((row, idx) => {
        const line = idx + 2; // +1 header, +1 base 1
        const normalizedRow: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row)) normalizedRow[normalizeKey(k)] = v;

        const str = (v: unknown) => String(v ?? '').trim();
        const empresaIdFromFile = str(normalizedRow.empresa_id);
        const empresaNome = str(normalizedRow.empresa_nome || normalizedRow.empresa || normalizedRow.nome_empresa || normalizedRow.empresas);
        const empresaId = (empresaIdFromFile && empresasIdSet.has(empresaIdFromFile) ? empresaIdFromFile : undefined)
          || (empresaNome ? empresasMap.get(normalize(empresaNome)) : undefined);
        const cod = str(normalizedRow.cod_funcionario || normalizedRow.codigo_funcionario || normalizedRow.codigo || normalizedRow.matricula || normalizedRow.cpf || normalizedRow.cod);
        const nome = str(normalizedRow.nome || normalizedRow.nome_funcionario || normalizedRow.funcionario);
        const dataAdm = parseDateISO(normalizedRow.data_admissao || normalizedRow.admissao || normalizedRow.data_de_admissao);
        const setorNome = str(normalizedRow.setor_nome || normalizedRow.setor);
        const funcaoNome = str(normalizedRow.funcao_nome || normalizedRow.funcao || normalizedRow.cargo);
        const categoriaNome = str(normalizedRow.categoria_nome || normalizedRow.categoria);
        const baseNome = str(normalizedRow.base_premiacao_nome || normalizedRow.base_premiacao || normalizedRow.base);
        const faixaNome = str(normalizedRow.faixa_nome || normalizedRow.faixa);
        const localNome = str(normalizedRow.local_dss_nome || normalizedRow.local_dss || normalizedRow.local);

        const setorId = str(normalizedRow.setor_id) || (setorNome ? setoresMap.get(normalize(setorNome)) : undefined);
        const funcaoId = str(normalizedRow.funcao_id) || (funcaoNome ? funcoesMap.get(normalize(funcaoNome)) : undefined);
        const categoriaId = str(normalizedRow.categoria_id) || (categoriaNome ? categoriasMap.get(normalize(categoriaNome)) : undefined);
        const baseId = str(normalizedRow.base_premiacao_id) || (baseNome ? basesMap.get(normalize(baseNome)) : undefined);
        const faixaId = str(normalizedRow.faixa_id) || (faixaNome ? faixasMap.get(normalize(faixaNome)) : undefined);
        const localDssId = str(normalizedRow.local_dss_id) || (localNome ? locaisMap.get(normalize(localNome)) : undefined);
        const status = str(normalizedRow.status || normalizedRow.status_funcional) || 'Ativo';

        const fail = (problema: string) => rows.push({ line, nome, cod_funcionario: cod, status: 'invalido', problema });

        if (!empresaId) return fail('Empresa não cadastrada');
        if (!cod) return fail('Código obrigatório');
        if (!nome) return fail('Nome obrigatório');
        if (setorNome && !setorId) return fail('Setor não cadastrado');
        if (funcaoNome && !funcaoId) return fail('Função não cadastrada');
        if (categoriaNome && !categoriaId) return fail('Categoria não cadastrada');
        if (baseNome && !baseId) return fail('Base de premiação não cadastrada');
        if (faixaNome && !faixaId) return fail('Faixa não cadastrada');
        if (localNome && !localDssId) return fail('Local DSS não cadastrado');

        if (codsSeen.has(cod)) {
          rows.push({ line, nome, cod_funcionario: cod, status: 'duplicado', problema: 'Código duplicado no arquivo' });
          return;
        }
        codsSeen.add(cod);

        rows.push({
          line, nome, cod_funcionario: cod,
          status: (!setorId || !funcaoId || !categoriaId) ? 'alerta' : 'valido',
          problema: (!setorId || !funcaoId || !categoriaId) ? 'Cadastro incompleto (sem setor/função/categoria)' : undefined,
          payload: {
            nome, cpf: cod, data_admissao: dataAdm || null, empresa_id: empresaId,
            setor_id: setorId || null, funcao_id: funcaoId || null, categoria_id: categoriaId || null,
            base_premiacao_id: baseId || null, faixa_id: faixaId || null, local_dss_id: localDssId || null,
            status, ativo: true,
          },
        });
      });

      // Duplicados já existentes no banco (por cpf) — checagem real, necessária antes do insert.
      const codsValidos = rows.filter((r) => r.status === 'valido' || r.status === 'alerta').map((r) => r.cod_funcionario);
      if (codsValidos.length) {
        const { data: existentes } = await supabase.from('concremrh_funcionarios').select('cpf').in('cpf', codsValidos);
        const existSet = new Set((existentes || []).map((e: { cpf: string }) => e.cpf));
        rows.forEach((r) => {
          if ((r.status === 'valido' || r.status === 'alerta') && existSet.has(r.cod_funcionario)) {
            r.status = 'duplicado';
            r.problema = 'Código já existente no banco';
          }
        });
      }

      setPreviewRows(rows);
      setStep('validacao');
    } catch (e) {
      toast({ title: 'Erro ao ler arquivo', description: e instanceof Error ? e.message : 'Falha ao processar o arquivo', variant: 'destructive' });
    } finally {
      setIsParsing(false);
    }
  };

  const summary: ImportSummary = {
    total: previewRows.length,
    validos: previewRows.filter((r) => r.status === 'valido').length,
    alertas: previewRows.filter((r) => r.status === 'alerta').length,
    invalidos: previewRows.filter((r) => r.status === 'invalido').length,
    duplicados: previewRows.filter((r) => r.status === 'duplicado').length,
  };

  /** Etapa 3 — insere apenas válidos + com alerta (cadastro incompleto ainda é importável). */
  const commitImport = async () => {
    const toInsert = previewRows.filter((r) => (r.status === 'valido' || r.status === 'alerta') && r.payload);
    if (toInsert.length === 0) return;
    setIsImporting(true);
    setProgress(0);
    let success = 0;
    const failed: ImportPreviewRow[] = [];
    for (let i = 0; i < toInsert.length; i++) {
      const row = toInsert[i];
      const { error } = await supabase.from('concremrh_funcionarios').insert(row.payload!);
      if (error) {
        failed.push({ ...row, status: 'invalido', problema: error.message });
      } else {
        success++;
      }
      if (i % 5 === 0) setProgress(Math.round(((i + 1) / toInsert.length) * 100));
    }
    setProgress(100);
    setInsertedCount(success);
    if (failed.length) setPreviewRows((prev) => [...prev.filter((r) => r.status !== 'valido' && r.status !== 'alerta'), ...failed]);
    toast({ title: 'Importação concluída', description: `${success} inserido(s), ${failed.length} com erro.` });
    setIsImporting(false);
    setStep('confirmacao');
    refetch();
  };

  const downloadErrorReport = () => {
    const problemRows = previewRows.filter((r) => r.status === 'invalido' || r.status === 'duplicado');
    if (problemRows.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(problemRows.map((r) => ({ Linha: r.line, Funcionário: r.nome, Código: r.cod_funcionario, Situação: r.status, Problema: r.problema || '' })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Erros');
    XLSX.writeFile(wb, 'relatorio_erros_importacao.xlsx');
  };

  return {
    step, setStep, file, setFile, isParsing, isImporting, progress,
    previewRows, summary, insertedCount,
    reset, downloadTemplate, buildPreview, commitImport, downloadErrorReport,
  };
}
