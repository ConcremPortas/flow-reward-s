// Validação pura das linhas de importação (sem I/O). Espelha exatamente os
// campos aceitos pelo fluxo atual (cod_funcionario/FALTAS/ADVERTENCIAS).
import type { OccurrenceImportRow, OccurrenceImportSummary } from '../types';

export interface FuncionarioLookup {
  id: string;
  nome: string;
}

const str = (v: unknown) => String(v ?? '').trim();

/** true se o valor bruto não é um inteiro não-negativo válido (mas não é vazio). */
function isInvalidNumeric(raw: unknown): boolean {
  if (raw == null || raw === '') return false;
  const n = Number(raw);
  return !Number.isFinite(n) || !Number.isInteger(n) || n < 0;
}

export function buildImportPreview(
  rows: Record<string, unknown>[],
  codMap: Map<string, FuncionarioLookup>,
): OccurrenceImportRow[] {
  const seen = new Set<string>();
  const out: OccurrenceImportRow[] = [];

  rows.forEach((row, idx) => {
    const line = idx + 2; // +1 header, +1 índice base 1
    const cod = str(row.cod_funcionario ?? row.COD_FUNCIONARIO ?? row.codigo ?? row.CODIGO);
    const faltasRaw = row.faltas ?? row.FALTAS;
    const advRaw = row.advertencias ?? row.ADVERTENCIAS;

    if (!cod) { out.push({ line, cod_funcionario: '', nome: '', faltas: 0, advertencias: 0, status: 'invalido', mensagem: 'Código do funcionário ausente' }); return; }

    const lookup = codMap.get(cod);
    if (!lookup) { out.push({ line, cod_funcionario: cod, nome: '', faltas: 0, advertencias: 0, status: 'invalido', mensagem: 'Funcionário não encontrado' }); return; }

    if (isInvalidNumeric(faltasRaw) || isInvalidNumeric(advRaw)) {
      out.push({ line, cod_funcionario: cod, nome: lookup.nome, faltas: 0, advertencias: 0, status: 'invalido', mensagem: 'Valor não numérico ou negativo', funcionarioId: lookup.id });
      return;
    }

    const faltas = parseInt(String(faltasRaw ?? 0), 10) || 0;
    const advertencias = parseInt(String(advRaw ?? 0), 10) || 0;

    if (seen.has(cod)) {
      out.push({ line, cod_funcionario: cod, nome: lookup.nome, faltas, advertencias, status: 'duplicado', mensagem: 'Código duplicado no arquivo', funcionarioId: lookup.id });
      return;
    }
    seen.add(cod);

    if (faltas === 0 && advertencias === 0) {
      out.push({ line, cod_funcionario: cod, nome: lookup.nome, faltas, advertencias, status: 'alerta', mensagem: 'Sem ocorrências (linha ignorada na importação)', funcionarioId: lookup.id });
      return;
    }

    out.push({ line, cod_funcionario: cod, nome: lookup.nome, faltas, advertencias, status: 'valido', funcionarioId: lookup.id });
  });

  return out;
}

export function summarizeImport(rows: OccurrenceImportRow[]): OccurrenceImportSummary {
  return {
    total: rows.length,
    validos: rows.filter((r) => r.status === 'valido').length,
    alertas: rows.filter((r) => r.status === 'alerta').length,
    invalidos: rows.filter((r) => r.status === 'invalido').length,
    duplicados: rows.filter((r) => r.status === 'duplicado').length,
  };
}
