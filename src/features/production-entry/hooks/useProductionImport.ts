import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import type { Setor } from '@/hooks/useSetores';
import type { ImportParsedRow, ImportSummary } from '../types/production-entry.types';
import { validateImportRows, summarizeImport } from '../domain/productionImportValidation';
import { competenciaToDate } from '../domain/productionCalculations';

type ImportStep = 'arquivo' | 'validacao' | 'confirmacao';

interface Args {
  setores: Setor[];
  onImported: () => void; // refetch
}

/**
 * Importação em 3 etapas com validação LOCAL antes de gravar (o fluxo legado
 * validava só no envio). Reutiliza a mesma biblioteca xlsx já usada no projeto.
 * A gravação insere somente linhas válidas que ainda não existem no banco —
 * nunca sobrescreve silenciosamente (registros já existentes viram alerta e
 * são pulados), preservando o comportamento do import legado.
 */
export function useProductionImport({ setores, onImported }: Args) {
  const [step, setStep] = useState<ImportStep>('arquivo');
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportParsedRow[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [parsing, setParsing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [insertedCount, setInsertedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep('arquivo'); setFile(null); setRows([]); setSummary(null);
    setParsing(false); setImporting(false); setInsertedCount(0); setError(null);
  };

  const downloadTemplate = () => {
    const linhas = setores.filter((s) => s.ativo).map((s) => ({
      setor_id: s.id, setor_nome: s.nome, competencia: '', meta_mensal: '', producao_realizada: '', unidade_medida: 'unidades',
    }));
    const ws = XLSX.utils.json_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
    XLSX.writeFile(wb, 'modelo_producao_setor.xlsx');
  };

  const validate = async (competenciaAlvo?: string) => {
    if (!file) return;
    setParsing(true);
    setError(null);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' }) as Record<string, unknown>[];

      // Chaves existentes no banco (setor+competência) para marcar duplicidade.
      const existingKeys = new Set<string>();
      const { data: existentes } = await supabase
        .from('concremrh_producao_setor')
        .select('setor_id,data_producao');
      for (const e of (existentes || []) as { setor_id: string | null; data_producao: string }[]) {
        if (e.setor_id) existingKeys.add(`${e.setor_id}|${e.data_producao.slice(0, 7)}`);
      }

      const parsed = validateImportRows({ rawRows, setores, existingKeys, competenciaAlvo });
      setRows(parsed);
      setSummary(summarizeImport(parsed));
      setStep('validacao');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao ler o arquivo');
    } finally {
      setParsing(false);
    }
  };

  /** Grava apenas as linhas válidas (não existentes). Alertas de duplicidade são pulados. */
  const confirmImport = async (): Promise<boolean> => {
    if (importing) return false;
    setImporting(true);
    setError(null);
    try {
      const toInsert = rows
        .filter((r) => r.status === 'valido' && r.setorId && r.competencia && r.meta != null && r.realizado != null)
        .map((r) => ({
          setor_id: r.setorId as string,
          data_producao: competenciaToDate(r.competencia),
          meta_diaria: r.meta as number,
          producao_realizada: r.realizado as number,
          unidade_medida: r.unidade || 'unidades',
        }));

      let inserted = 0;
      const chunk = 200;
      for (let i = 0; i < toInsert.length; i += chunk) {
        const slice = toInsert.slice(i, i + chunk);
        const { error: insErr } = await supabase.from('concremrh_producao_setor').insert(slice);
        if (insErr) throw insErr;
        inserted += slice.length;
      }
      setInsertedCount(inserted);
      setStep('confirmacao');
      onImported();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao importar');
      return false;
    } finally {
      setImporting(false);
    }
  };

  /** Relatório de erros/alertas em CSV para download. */
  const downloadErrorReport = () => {
    const problematic = rows.filter((r) => r.status !== 'valido');
    const header = 'linha;setor;competencia;meta;realizado;situacao;problema';
    const body = problematic.map((r) =>
      [r.linha, r.setorNome, r.competencia, r.meta ?? '', r.realizado ?? '', r.status, (r.problema ?? '').replace(/;/g, ',')].join(';'),
    );
    const csv = [header, ...body].join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'relatorio_erros_importacao.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return {
    step, setStep, file, setFile, rows, summary, parsing, importing, insertedCount, error,
    reset, downloadTemplate, validate, confirmImport, downloadErrorReport,
  };
}

export type UseProductionImportReturn = ReturnType<typeof useProductionImport>;
