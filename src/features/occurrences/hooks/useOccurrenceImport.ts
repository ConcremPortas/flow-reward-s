import { useState } from 'react';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { OccurrenceDraftMap, OccurrenceImportRow, OccurrenceImportSummary } from '../types';
import { buildImportPreview, summarizeImport, type FuncionarioLookup } from '../domain/occurrenceImportValidation';

export type OccurrenceImportStep = 'arquivo' | 'validacao' | 'confirmacao';
const MAX_SIZE_MB = 5;
const ACCEPTED = ['.xlsx', '.xls', '.csv'];

/**
 * Importação de faltas/advertências em 3 etapas com pré-visualização local.
 * A confirmação da importação MERGE os valores no rascunho da apuração mensal
 * (não salva direto no banco) — assim a revisão/barra de salvamento do
 * Lançamento Mensal passa a valer também para dados importados, corrigindo o
 * comportamento anterior (import salvava direto, sem revisão nem proteção
 * contra sobrescrever edições manuais).
 */
export function useOccurrenceImport(funcionariosAtivos: Funcionario[], mesCompetencia: string) {
  const { toast } = useToast();
  const [step, setStep] = useState<OccurrenceImportStep>('arquivo');
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [previewRows, setPreviewRows] = useState<OccurrenceImportRow[]>([]);

  const reset = () => { setStep('arquivo'); setFile(null); setIsParsing(false); setPreviewRows([]); };

  const downloadTemplate = () => {
    const rows = funcionariosAtivos.map((f) => ({ cod_funcionario: f.cpf || '', funcionario: f.nome, faltas: 0, advertencias: 0 }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Faltas');
    XLSX.writeFile(wb, `template_faltas_${mesCompetencia}.xlsx`);
  };

  const buildPreview = async () => {
    if (!file) return;
    setIsParsing(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, unknown>[];

      if (rows.length === 0) {
        toast({ title: 'Arquivo vazio', description: 'Nenhuma linha encontrada na primeira aba da planilha.', variant: 'destructive' });
        setIsParsing(false);
        return;
      }

      const codMap = new Map<string, FuncionarioLookup>();
      funcionariosAtivos.forEach((f) => { if (f.cpf) codMap.set(String(f.cpf).trim(), { id: f.id, nome: f.nome }); });

      setPreviewRows(buildImportPreview(rows, codMap));
      setStep('validacao');
    } catch (e) {
      toast({ title: 'Erro ao ler arquivo', description: e instanceof Error ? e.message : 'Falha ao processar o arquivo', variant: 'destructive' });
    } finally {
      setIsParsing(false);
    }
  };

  const summary: OccurrenceImportSummary = summarizeImport(previewRows);

  const getValidEntries = (): OccurrenceDraftMap => {
    const map: OccurrenceDraftMap = {};
    previewRows.filter((r) => r.status === 'valido' && r.funcionarioId).forEach((r) => {
      map[r.funcionarioId!] = { faltas: r.faltas, advertencias: r.advertencias };
    });
    return map;
  };

  const downloadErrorReport = () => {
    const problemRows = previewRows.filter((r) => r.status === 'invalido' || r.status === 'duplicado');
    if (problemRows.length === 0) return;
    const ws = XLSX.utils.json_to_sheet(problemRows.map((r) => ({ Linha: r.line, Código: r.cod_funcionario, Funcionário: r.nome, Situação: r.status, Mensagem: r.mensagem || '' })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Erros');
    XLSX.writeFile(wb, 'relatorio_erros_importacao_faltas.xlsx');
  };

  const acceptFile = (f: File | null): string | null => {
    if (!f) { setFile(null); return null; }
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED.includes(ext)) return 'Formato não suportado. Use .xlsx, .xls ou .csv.';
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `Arquivo maior que ${MAX_SIZE_MB}MB.`;
    setFile(f);
    return null;
  };

  return {
    step, setStep, file, acceptFile, isParsing,
    previewRows, summary, getValidEntries,
    reset, downloadTemplate, buildPreview, downloadErrorReport,
    maxSizeMb: MAX_SIZE_MB, acceptedFormats: ACCEPTED,
  };
}
