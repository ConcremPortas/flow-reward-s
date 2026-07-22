// Cálculos de produção por setor — funções puras.
//
// AUDITORIA: percentual = realizado / meta * 100 (ProducaoSetor.tsx:183-185,
// que arredondava para inteiro só na exibição). Aqui preservamos a FÓRMULA e
// tratamos meta zero/nula e realizado nulo. O motor de premiação usa a sua
// própria função (calcularNotaProducao) — este cálculo é só de exibição e não
// o altera.
import type { ProducaoSetor } from '@/hooks/useProducaoSetor';
import type { Setor } from '@/hooks/useSetores';
import { competenciaLabel } from '@/features/dashboard/utils/dates';
import type {
  ProductionDraftMap, ProductionEntry, ProductionRow, ProductionSituacao,
} from '../types/production-entry.types';
import { classifySituacao } from './productionStatus';

/** Competência 'YYYY-MM' → data de persistência 'YYYY-MM-01' (sem timezone). */
export function competenciaToDate(competencia: string): string {
  return `${competencia}-01`;
}

/** Data de persistência ('YYYY-MM-01' ou ISO) → competência 'YYYY-MM'. */
export function dateToCompetencia(dataProducao: string | null | undefined): string {
  if (!dataProducao) return '';
  return dataProducao.slice(0, 7);
}

/** Rótulo curto de competência com ano completo: 'mai/2026'. */
export function competenciaShortLabelBR(competencia: string): string {
  const short = competenciaLabel(competencia); // 'mai/26'
  const [, mmAno] = /^([a-z]{3})\/(\d{2})$/.exec(short) ?? [];
  const [ano] = competencia.split('-');
  if (!mmAno || !ano) return competencia;
  return short.replace(/\/\d{2}$/, `/${ano}`);
}

/** Percentual de atingimento (realizado/meta*100). Null quando não calculável. */
export function calcularPercentual(realizado: number | null, meta: number | null): number | null {
  if (realizado == null || meta == null || meta <= 0) return null;
  return (realizado / meta) * 100;
}

/** Desvio absoluto (realizado - meta). Null quando algum valor ausente. */
export function calcularDesvio(realizado: number | null, meta: number | null): number | null {
  if (realizado == null || meta == null) return null;
  return realizado - meta;
}

/** Variação percentual do realizado vs. período anterior. Null se base ausente/zero. */
export function calcularVariacao(atual: number | null, anterior: number | null): number | null {
  if (atual == null || anterior == null || anterior === 0) return null;
  return ((atual - anterior) / Math.abs(anterior)) * 100;
}

/**
 * Constrói o baseline {setorId: {meta, realizado}} a partir dos registros
 * salvos da competência. Exclui indicadores (unidade 'percentual'), que não
 * são produção. Se houver mais de um registro por setor (duplicado), usa o
 * primeiro encontrado (o modelo lógico é 1 registro por setor+competência; a
 * importação já deduplica) — duplicidades reais são sinalizadas em outro ponto.
 */
export function buildBaselineFromRegistros(registros: ProducaoSetor[], competencia: string): ProductionDraftMap {
  const dataCompetencia = competenciaToDate(competencia);
  const map: ProductionDraftMap = {};
  for (const r of registros) {
    if (r.unidade_medida === 'percentual') continue;
    if (dateToCompetencia(r.data_producao) !== competencia && r.data_producao !== dataCompetencia) continue;
    if (!r.setor_id) continue;
    if (map[r.setor_id]) continue; // mantém o primeiro (dedup defensivo)
    map[r.setor_id] = { meta: r.meta_diaria ?? null, realizado: r.producao_realizada ?? null };
  }
  return map;
}

/** Índice {setorId: registroId} da competência (para saber o que atualizar vs. inserir). */
export function buildRegistroIdIndex(registros: ProducaoSetor[], competencia: string): Record<string, string> {
  const idx: Record<string, string> = {};
  for (const r of registros) {
    if (r.unidade_medida === 'percentual' || !r.setor_id) continue;
    if (dateToCompetencia(r.data_producao) !== competencia) continue;
    if (idx[r.setor_id]) continue;
    idx[r.setor_id] = r.id;
  }
  return idx;
}

/** Índice {setorId: unidade} e {setorId: observacoes} da competência. */
export function buildRegistroMetaIndex(registros: ProducaoSetor[], competencia: string): Record<string, { unidade: string; observacoes: string | null }> {
  const idx: Record<string, { unidade: string; observacoes: string | null }> = {};
  for (const r of registros) {
    if (r.unidade_medida === 'percentual' || !r.setor_id) continue;
    if (dateToCompetencia(r.data_producao) !== competencia) continue;
    if (idx[r.setor_id]) continue;
    idx[r.setor_id] = { unidade: r.unidade_medida || 'unidades', observacoes: r.observacoes ?? null };
  }
  return idx;
}

interface BuildRowsArgs {
  setoresPrevistos: Setor[];
  draft: ProductionDraftMap;
  registroIdIndex: Record<string, string>;
  unidadeIndex: Record<string, { unidade: string; observacoes: string | null }>;
  baselineAnterior?: ProductionDraftMap; // competência anterior (comparação)
}

/**
 * Monta as linhas da grade de apuração — uma por setor previsto (setores ativos,
 * ver limitação documentada em useProductionEntry). Situação/percentual/desvio
 * derivam do draft atual.
 */
export function buildProductionRows({
  setoresPrevistos, draft, registroIdIndex, unidadeIndex, baselineAnterior,
}: BuildRowsArgs): ProductionRow[] {
  return setoresPrevistos.map((setor) => {
    const entry: ProductionEntry = draft[setor.id] ?? { meta: null, realizado: null };
    const temRegistro = !!registroIdIndex[setor.id];
    const percentual = calcularPercentual(entry.realizado, entry.meta);
    const situacao: ProductionSituacao = classifySituacao(percentual, temRegistro || entry.meta != null || entry.realizado != null);
    const anterior = baselineAnterior?.[setor.id];

    return {
      setorId: setor.id,
      setorNome: setor.nome,
      empresaId: setor.empresa_id ?? null,
      empresaNome: setor.empresa?.nome ?? null,
      unidade: unidadeIndex[setor.id]?.unidade ?? 'unidades',
      meta: entry.meta,
      realizado: entry.realizado,
      percentual,
      desvio: calcularDesvio(entry.realizado, entry.meta),
      situacao,
      registroId: registroIdIndex[setor.id] ?? null,
      temRegistro,
      observacoes: unidadeIndex[setor.id]?.observacoes ?? null,
      metaAnterior: anterior?.meta ?? null,
      realizadoAnterior: anterior?.realizado ?? null,
      percentualAnterior: anterior ? calcularPercentual(anterior.realizado, anterior.meta) : null,
      variacaoRealizado: anterior ? calcularVariacao(entry.realizado, anterior.realizado) : null,
    };
  });
}

export interface ProductionSummaryCounts {
  previstos: number;
  apurados: number;
  pendentes: number;
  superada: number;
  proxima: number;
  abaixo: number;
  mediaAtingimento: number | null; // média dos percentuais dos setores apurados
}

/** Agrega contagens do resumo da competência a partir das linhas. */
export function computeSummary(rows: ProductionRow[]): ProductionSummaryCounts {
  const previstos = rows.length;
  const apuradas = rows.filter((r) => r.situacao !== 'pendente');
  const percentuais = apuradas.map((r) => r.percentual).filter((p): p is number => p != null);
  return {
    previstos,
    apurados: apuradas.length,
    pendentes: previstos - apuradas.length,
    superada: rows.filter((r) => r.situacao === 'superada').length,
    proxima: rows.filter((r) => r.situacao === 'proxima').length,
    abaixo: rows.filter((r) => r.situacao === 'abaixo').length,
    mediaAtingimento: percentuais.length > 0
      ? percentuais.reduce((a, b) => a + b, 0) / percentuais.length
      : null,
  };
}
