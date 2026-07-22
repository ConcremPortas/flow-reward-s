// Escopo do processamento e leitura do histórico — puros.
//
// AUDITORIA: a chave de identificação/sobrescrita é (mes_competencia + base).
// `salvarResultados` deleta e reinsere por (competência, base). Categorias NÃO
// fazem parte da chave — apenas filtram funcionários. Aqui só derivamos/agrupamos
// (não persistimos, não alteramos a estratégia).
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { BasePremiacao } from '@/hooks/useBasePremiacao';
import { competenciaLabel } from '@/features/dashboard/utils/dates';
import type { ExistingProcessing, ProcessingRow } from '../types/rewards-processing.types';

/** Competência 'YYYY-MM' → chave de persistência 'YYYY-MM-01' (sem timezone). */
export function competenciaToMes(competencia: string): string {
  return `${competencia}-01`;
}

/** 'YYYY-MM-01' (ou ISO) → competência 'YYYY-MM'. */
export function mesToCompetencia(mes: string | null | undefined): string {
  return mes ? mes.slice(0, 7) : '';
}

export function scopeKey(competencia: string, baseId: string): string {
  return `${competenciaToMes(competencia)}|${baseId}`;
}

/** Rótulo curto de competência com ano completo: 'mai/2026'. */
export function competenciaShortLabelBR(competencia: string): string {
  const short = competenciaLabel(competencia);
  const [ano] = competencia.split('-');
  if (!ano || short === competencia) return competencia;
  return short.replace(/\/\d{2}$/, `/${ano}`);
}

interface Agg {
  mesCompetencia: string;
  baseId: string | null;
  categorias: Set<string>;
  funcionarios: Set<string>;
  resultados: number;
  valorTotal: number;
  processadoEm: string | null;
  problemas: Set<string>;
}

function latestTs(a: string | null, b: string | null | undefined): string | null {
  if (!b) return a;
  if (!a) return b;
  return b > a ? b : a;
}

/**
 * Agrupa `resultados` por (mes + base) em linhas do histórico. Sinaliza
 * integridade "incompleto" para grupos sem base, sem funcionário vinculado ou
 * sem nome — NÃO oculta nem corrige (auditoria de registros incompletos).
 */
export function buildProcessingRows(resultados: ResultadoPremiacao[], bases: BasePremiacao[]): ProcessingRow[] {
  const baseNameById = new Map(bases.map((b) => [b.id, b.nome]));
  const map = new Map<string, Agg>();

  for (const r of resultados) {
    const key = `${r.mes_competencia}|${r.base_premiacao_id ?? '∅'}`;
    const agg = map.get(key) ?? {
      mesCompetencia: r.mes_competencia,
      baseId: r.base_premiacao_id ?? null,
      categorias: new Set<string>(),
      funcionarios: new Set<string>(),
      resultados: 0,
      valorTotal: 0,
      processadoEm: null,
      problemas: new Set<string>(),
    };
    agg.resultados += 1;
    agg.valorTotal += r.bonus_alcancado || 0;
    if (r.categoria) agg.categorias.add(r.categoria);
    if (r.funcionario_id) agg.funcionarios.add(r.funcionario_id);
    else agg.problemas.add('Resultado sem funcionário vinculado');
    if (!r.base_premiacao_id) agg.problemas.add('Registro sem base de premiação');
    if (!r.nome) agg.problemas.add('Resultado sem nome');
    if (!r.mes_competencia) agg.problemas.add('Registro sem competência');
    agg.processadoEm = latestTs(agg.processadoEm, r.updated_at || r.created_at);
    map.set(key, agg);
  }

  return [...map.values()]
    .map((agg): ProcessingRow => ({
      competencia: mesToCompetencia(agg.mesCompetencia),
      mesCompetencia: agg.mesCompetencia,
      baseId: agg.baseId ?? '',
      baseNome: agg.baseId ? (baseNameById.get(agg.baseId) ?? 'Base não encontrada') : 'Sem base',
      categorias: [...agg.categorias].sort(),
      resultados: agg.resultados,
      funcionariosUnicos: agg.funcionarios.size,
      valorTotal: agg.valorTotal,
      processadoEm: agg.processadoEm,
      integridade: agg.problemas.size > 0 ? 'incompleto' : 'ok',
      problemas: [...agg.problemas],
    }))
    .sort((a, b) => (a.mesCompetencia === b.mesCompetencia ? a.baseNome.localeCompare(b.baseNome) : a.mesCompetencia < b.mesCompetencia ? 1 : -1));
}

/** Processamento existente para (competência, base), a partir dos resultados salvos. */
export function findExistingProcessing(
  resultados: ResultadoPremiacao[], bases: BasePremiacao[], competencia: string, baseId: string,
): ExistingProcessing | null {
  const mes = competenciaToMes(competencia);
  const rows = resultados.filter((r) => r.mes_competencia === mes && r.base_premiacao_id === baseId);
  if (rows.length === 0) return null;
  let processadoEm: string | null = null;
  const categorias = new Set<string>();
  let valorTotal = 0;
  for (const r of rows) {
    valorTotal += r.bonus_alcancado || 0;
    if (r.categoria) categorias.add(r.categoria);
    processadoEm = latestTs(processadoEm, r.updated_at || r.created_at);
  }
  return {
    competencia, baseId,
    baseNome: bases.find((b) => b.id === baseId)?.nome ?? 'Base não encontrada',
    processadoEm,
    resultados: rows.length,
    valorTotal,
    categorias: [...categorias].sort(),
  };
}
