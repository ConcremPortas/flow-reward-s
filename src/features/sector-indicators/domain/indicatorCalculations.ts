// Cálculos dos indicadores por setor — funções puras.
//
// AUDITORIA (fórmula de atingimento): a tela legada e o motor de premiação usam
// percentual = realizado / meta. A tela exibia em % inteiro; o motor usa a fração
// limitada a 1,0. Aqui centralizamos o cálculo de EXIBIÇÃO (escala 0-100, sem
// arredondar) e tratamos meta zero/nula e realizado nulo. O motor de premiação
// tem a própria função (calcularMediaIndicador) — este módulo é só de exibição e
// não altera a nota geral. O `_percentual` persistido é gravado como FRAÇÃO
// (realizado/meta), idêntico ao hook legado `calcularPercentuais`.
import type { IndicadorSetor } from '@/hooks/useIndicadoresSetor';
import type { Setor } from '@/hooks/useSetores';
import { competenciaLabel } from '@/features/dashboard/utils/dates';
import type {
  IndicatorCell, IndicatorId, IndicatorPair, IndicatorPersistFields,
  SectorIndicatorDraftMap, SectorIndicatorEntry, SectorIndicatorRow,
} from '../types/sector-indicators.types';
import { INDICATOR_DEFINITIONS, INDICATOR_IDS } from './indicatorDefinitions';
import { classifyCellState, classifySectorSituacao } from './indicatorStatus';

/** Valor convencional de "sem medição" (todos os pares 1/1 → 100%). */
export const SEM_MEDICAO_VALUE = 1;

// ── Competência (sem timezone) ──────────────────────────────────────────────

/** Competência 'YYYY-MM' → data de persistência 'YYYY-MM-01' (sem timezone). */
export function competenciaToDate(competencia: string): string {
  return `${competencia}-01`;
}

/** Competência persistida ('YYYY-MM-01' ou ISO) → 'YYYY-MM'. */
export function dateToCompetencia(competencia: string | null | undefined): string {
  if (!competencia) return '';
  return competencia.slice(0, 7);
}

/** Rótulo curto de competência com ano completo: 'mai/2026'. */
export function competenciaShortLabelBR(competencia: string): string {
  const short = competenciaLabel(competencia); // 'mai/26'
  const [ano] = competencia.split('-');
  if (!ano || short === competencia) return competencia;
  return short.replace(/\/\d{2}$/, `/${ano}`);
}

// ── Aritmética de atingimento ───────────────────────────────────────────────

/** Percentual de atingimento (realizado/meta*100). Null quando não calculável. */
export function calcularPercentual(realizado: number | null, meta: number | null): number | null {
  if (realizado == null || meta == null || meta <= 0) return null;
  return (realizado / meta) * 100;
}

/** Percentual persistido como FRAÇÃO (realizado/meta), regra do hook legado. */
export function calcularPercentualFracao(meta: number | null | undefined, realizado: number | null | undefined): number | null {
  if (!meta || meta === 0) return null;
  return realizado ? realizado / meta : 0;
}

/** Desvio absoluto (realizado - meta). Null quando algum valor ausente. */
export function calcularDesvio(realizado: number | null, meta: number | null): number | null {
  if (realizado == null || meta == null) return null;
  return realizado - meta;
}

/** Variação em pontos percentuais (percentual atual - anterior). Null se faltar base. */
export function calcularVariacaoPP(atual: number | null, anterior: number | null): number | null {
  if (atual == null || anterior == null) return null;
  return atual - anterior;
}

// ── Entradas (5 pares) ──────────────────────────────────────────────────────

/** Entrada vazia (nenhum indicador preenchido). */
export function emptyEntry(): SectorIndicatorEntry {
  return INDICATOR_IDS.reduce((acc, id) => {
    acc[id] = { meta: null, realizado: null };
    return acc;
  }, {} as SectorIndicatorEntry);
}

/** Entrada "sem medição" — todos os pares 1/1 (100%). Convenção do modelo legado. */
export function makeSemMedicaoEntry(): SectorIndicatorEntry {
  return INDICATOR_IDS.reduce((acc, id) => {
    acc[id] = { meta: SEM_MEDICAO_VALUE, realizado: SEM_MEDICAO_VALUE };
    return acc;
  }, {} as SectorIndicatorEntry);
}

/**
 * "Sem medição" é uma convenção do registro inteiro (não há coluna dedicada):
 * todos os cinco pares valem 1/1. LIMITAÇÃO documentada: um setor que legitima-
 * mente medisse 1/1 em todos os indicadores é indistinguível de "sem medição" —
 * é assim que a tela legada já se comporta; preservamos a regra.
 */
export function isSemMedicaoEntry(entry: SectorIndicatorEntry | undefined): boolean {
  if (!entry) return false;
  return INDICATOR_IDS.every((id) => entry[id]?.meta === SEM_MEDICAO_VALUE && entry[id]?.realizado === SEM_MEDICAO_VALUE);
}

/** Algum indicador tem meta ou realizado preenchido? */
export function entryHasData(entry: SectorIndicatorEntry | undefined): boolean {
  if (!entry) return false;
  return INDICATOR_IDS.some((id) => entry[id]?.meta != null || entry[id]?.realizado != null);
}

/** Lê os cinco pares de um registro salvo. */
export function buildEntryFromRegistro(reg: IndicadorSetor): SectorIndicatorEntry {
  const entry = emptyEntry();
  for (const def of INDICATOR_DEFINITIONS) {
    entry[def.id] = {
      meta: (reg[def.metaField] as number | null | undefined) ?? null,
      realizado: (reg[def.realizadoField] as number | null | undefined) ?? null,
    };
  }
  return entry;
}

/** Campos persistidos (15 colunas) a partir de uma entrada. Percentual = fração. */
export function persistFieldsFromEntry(entry: SectorIndicatorEntry): IndicatorPersistFields {
  const out = {} as IndicatorPersistFields;
  for (const def of INDICATOR_DEFINITIONS) {
    const pair = entry[def.id] ?? { meta: null, realizado: null };
    out[def.metaField] = pair.meta;
    out[def.realizadoField] = pair.realizado;
    out[def.percentualField] = calcularPercentualFracao(pair.meta, pair.realizado);
  }
  return out;
}

// ── Baseline / índices a partir dos registros ───────────────────────────────

/**
 * Baseline {setorId: entry} da competência. Se houver mais de um registro por
 * setor (duplicado), usa o primeiro (o modelo lógico é 1 por setor+competência).
 */
export function buildBaselineFromRegistros(indicadores: IndicadorSetor[], competencia: string): SectorIndicatorDraftMap {
  const map: SectorIndicatorDraftMap = {};
  for (const reg of indicadores) {
    if (!reg.setor_id) continue;
    if (dateToCompetencia(reg.competencia) !== competencia) continue;
    if (map[reg.setor_id]) continue; // dedup defensivo — mantém o primeiro
    map[reg.setor_id] = buildEntryFromRegistro(reg);
  }
  return map;
}

/** Índice {setorId: registroId} da competência (saber o que atualizar vs. inserir). */
export function buildRegistroIdIndex(indicadores: IndicadorSetor[], competencia: string): Record<string, string> {
  const idx: Record<string, string> = {};
  for (const reg of indicadores) {
    if (!reg.setor_id || dateToCompetencia(reg.competencia) !== competencia) continue;
    if (idx[reg.setor_id]) continue;
    idx[reg.setor_id] = reg.id;
  }
  return idx;
}

// ── Derivação de células / linhas ───────────────────────────────────────────

/** Média de exibição (não ponderada) dos percentuais calculáveis das células. */
export function computeMedia(cells: Record<IndicatorId, IndicatorCell>): number | null {
  const vals = INDICATOR_IDS.map((id) => cells[id]?.percentual).filter((p): p is number => p != null);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** Pior indicador (menor percentual — todos "maior = melhor"). */
export function computePiorIndicador(cells: Record<IndicatorId, IndicatorCell>): SectorIndicatorRow['piorIndicador'] {
  let pior: { indicatorId: IndicatorId; percentual: number } | null = null;
  for (const id of INDICATOR_IDS) {
    const p = cells[id]?.percentual;
    if (p == null) continue;
    if (!pior || p < pior.percentual) pior = { indicatorId: id, percentual: p };
  }
  return pior;
}

function buildCells(
  entry: SectorIndicatorEntry,
  semMedicao: boolean,
  anterior?: SectorIndicatorEntry,
): Record<IndicatorId, IndicatorCell> {
  const cells = {} as Record<IndicatorId, IndicatorCell>;
  for (const id of INDICATOR_IDS) {
    const pair: IndicatorPair = entry[id] ?? { meta: null, realizado: null };
    const percentual = calcularPercentual(pair.realizado, pair.meta);
    const hasData = pair.meta != null || pair.realizado != null;
    const antPair = anterior?.[id];
    const percentualAnterior = antPair ? calcularPercentual(antPair.realizado, antPair.meta) : null;
    cells[id] = {
      indicatorId: id,
      meta: pair.meta,
      realizado: pair.realizado,
      percentual,
      desvio: calcularDesvio(pair.realizado, pair.meta),
      state: classifyCellState(percentual, { hasData, semMedicao }),
      percentualAnterior: anterior ? percentualAnterior : undefined,
      variacaoPP: anterior ? calcularVariacaoPP(percentual, percentualAnterior) : undefined,
    };
  }
  return cells;
}

interface BuildRowsArgs {
  setoresPrevistos: Setor[];
  draft: SectorIndicatorDraftMap;
  registroIdIndex: Record<string, string>;
  baselineAnterior?: SectorIndicatorDraftMap;
}

/** Monta as linhas da matriz — uma por setor previsto (setores ativos). */
export function buildSectorRows({ setoresPrevistos, draft, registroIdIndex, baselineAnterior }: BuildRowsArgs): SectorIndicatorRow[] {
  return setoresPrevistos.map((setor) => {
    const entry = draft[setor.id] ?? emptyEntry();
    const semMedicao = isSemMedicaoEntry(entry);
    const temDados = entryHasData(entry);
    const cells = buildCells(entry, semMedicao, baselineAnterior?.[setor.id]);
    const media = semMedicao ? null : computeMedia(cells);
    return {
      setorId: setor.id,
      setorNome: setor.nome,
      empresaId: setor.empresa_id ?? null,
      empresaNome: setor.empresa?.nome ?? null,
      cells,
      media,
      situacao: classifySectorSituacao(media, { temDados, semMedicao }),
      registroId: registroIdIndex[setor.id] ?? null,
      temRegistro: !!registroIdIndex[setor.id],
      temDados,
      semMedicao,
      piorIndicador: semMedicao ? null : computePiorIndicador(cells),
    };
  });
}

export interface IndicatorSummaryCounts {
  previstos: number;
  apurados: number;
  pendentes: number;
  metaAtingida: number;   // situação 'superada'
  emAtencao: number;      // situação 'proxima'
  abaixo: number;
  semMedicao: number;
  mediaGeral: number | null; // média das médias dos setores apurados (exclui sem medição)
}

/** Agrega contagens do resumo da competência a partir das linhas. */
export function computeSummary(rows: SectorIndicatorRow[]): IndicatorSummaryCounts {
  const previstos = rows.length;
  const apurados = rows.filter((r) => r.situacao !== 'pendente');
  const medias = rows.map((r) => r.media).filter((m): m is number => m != null);
  return {
    previstos,
    apurados: apurados.length,
    pendentes: previstos - apurados.length,
    metaAtingida: rows.filter((r) => r.situacao === 'superada').length,
    emAtencao: rows.filter((r) => r.situacao === 'proxima').length,
    abaixo: rows.filter((r) => r.situacao === 'abaixo').length,
    semMedicao: rows.filter((r) => r.situacao === 'sem_medicao').length,
    mediaGeral: medias.length > 0 ? medias.reduce((a, b) => a + b, 0) / medias.length : null,
  };
}
