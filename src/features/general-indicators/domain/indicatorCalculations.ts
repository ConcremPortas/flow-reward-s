// Cálculos dos indicadores gerais — funções puras.
import type { IndicadorGeral } from '@/hooks/useIndicadoresGerais';
import type { TipoIndicadorGeral } from '@/hooks/useTiposIndicadoresGerais';
import { competenciaLabel, lastCompetencias, shiftCompetencia } from '@/features/dashboard/utils/dates';
import type { DataQualitySignal, GeneralIndicatorCardData, GeneralIndicatorPoint } from '../types/general-indicators.types';
import { resolveIndicatorDefinition, type IndicatorDefinition } from './indicatorDefinitions';
import { calcularAtingimento, classifyGeneralSituacao } from './indicatorStatus';

// ── Competência (sem timezone) ──────────────────────────────────────────────

export function competenciaToDate(competencia: string): string {
  return `${competencia}-01`;
}

export function dateToCompetencia(competencia: string | null | undefined): string {
  if (!competencia) return '';
  return competencia.slice(0, 7);
}

export function competenciaShortLabelBR(competencia: string): string {
  const short = competenciaLabel(competencia); // 'mai/26'
  const [ano] = competencia.split('-');
  if (!ano || short === competencia) return competencia;
  return short.replace(/\/\d{2}$/, `/${ano}`);
}

// ── Aritmética ───────────────────────────────────────────────────────────────

export function calcularDesvio(realizado: number | null, meta: number | null): number | null {
  if (realizado == null || meta == null) return null;
  return realizado - meta;
}

/** Variação percentual do realizado vs. período anterior. Null se base ausente/zero. */
export function calcularVariacao(atual: number | null, anterior: number | null): number | null {
  if (atual == null || anterior == null || anterior === 0) return null;
  return ((atual - anterior) / Math.abs(anterior)) * 100;
}

/** Variação em pontos percentuais (atingimento atual - anterior). */
export function calcularVariacaoPP(atual: number | null, anterior: number | null): number | null {
  if (atual == null || anterior == null) return null;
  return atual - anterior;
}

/** Mediana de uma lista de números (ignora nulos). Null se vazia. */
export function median(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => v != null && !Number.isNaN(v)).sort((a, b) => a - b);
  if (nums.length === 0) return null;
  const mid = Math.floor(nums.length / 2);
  return nums.length % 2 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
}

/**
 * Tendência determinística do realizado. Exige histórico mínimo (>= 3 pontos).
 * Banda plana de ±2% sobre o primeiro valor da janela. Não é previsão futura.
 */
export function computeTrend(values: number[]): 'up' | 'down' | 'flat' | null {
  if (values.length < 3) return null;
  const first = values[0];
  const last = values[values.length - 1];
  const base = Math.abs(first) || 1;
  const change = (last - first) / base;
  if (change > 0.02) return 'up';
  if (change < -0.02) return 'down';
  return 'flat';
}

// ── Construção de pontos / séries ───────────────────────────────────────────

/** Deriva um ponto (métricas de exibição) de um registro salvo. */
export function buildPoint(reg: IndicadorGeral, def: IndicatorDefinition): GeneralIndicatorPoint {
  const meta = reg.meta ?? null;
  const realizado = reg.realizado ?? null;
  const atingimento = calcularAtingimento(realizado, meta, def.direction);
  return {
    registroId: reg.id,
    tipoId: reg.tipo_indicador_id,
    codigo: def.code,
    nome: reg.tipo_indicador?.nome ?? def.label,
    competencia: dateToCompetencia(reg.competencia),
    meta,
    realizado,
    atingimento,
    percentualArmazenado: reg.percentual ?? null,
    desvio: calcularDesvio(realizado, meta),
    situacao: classifyGeneralSituacao(atingimento, meta != null || realizado != null),
  };
}

/** Índice {tipoId: pontos ordenados por competência asc}. */
export function pointsByTipo(indicadores: IndicadorGeral[], tiposById: Map<string, TipoIndicadorGeral>): Map<string, GeneralIndicatorPoint[]> {
  const map = new Map<string, GeneralIndicatorPoint[]>();
  for (const reg of indicadores) {
    const tipo = tiposById.get(reg.tipo_indicador_id);
    const def = resolveIndicatorDefinition(tipo?.codigo ?? reg.tipo_indicador?.codigo, tipo?.nome ?? reg.tipo_indicador?.nome);
    const point = buildPoint(reg, def);
    const arr = map.get(reg.tipo_indicador_id) ?? [];
    arr.push(point);
    map.set(reg.tipo_indicador_id, arr);
  }
  for (const arr of map.values()) arr.sort((a, b) => (a.competencia < b.competencia ? -1 : a.competencia > b.competencia ? 1 : 0));
  return map;
}

/** Série de até `count` competências terminando em `competencia` (pontos ou null). */
export function seriesForTipo(points: GeneralIndicatorPoint[], competencia: string, count = 12): (GeneralIndicatorPoint | null)[] {
  const byComp = new Map(points.map((p) => [p.competencia, p]));
  return lastCompetencias(competencia, count).map((c) => byComp.get(c) ?? null);
}

/**
 * Monta os dados do card executivo de um indicador para a competência.
 * `analyze` (injetado) produz os sinais de qualidade — mantém o domínio de
 * cálculo desacoplado das regras de anomalia.
 */
export function buildCardData(
  tipo: TipoIndicadorGeral,
  points: GeneralIndicatorPoint[],
  competencia: string,
  analyze?: (point: GeneralIndicatorPoint, historico: GeneralIndicatorPoint[]) => DataQualitySignal[],
): GeneralIndicatorCardData {
  const def = resolveIndicatorDefinition(tipo.codigo, tipo.nome);
  const byComp = new Map(points.map((p) => [p.competencia, p]));
  const atual = byComp.get(competencia) ?? null;
  const anterior = byComp.get(shiftCompetencia(competencia, -1)) ?? null;

  const serie = seriesForTipo(points, competencia, 12).filter((p): p is GeneralIndicatorPoint => p != null);
  const realizadosSerie = serie.map((p) => p.realizado).filter((v): v is number => v != null);

  return {
    tipoId: tipo.id,
    codigo: def.code,
    nome: tipo.nome,
    descricao: tipo.descricao,
    atual,
    anterior,
    serie,
    variacaoRealizado: calcularVariacao(atual?.realizado ?? null, anterior?.realizado ?? null),
    variacaoPP: calcularVariacaoPP(atual?.atingimento ?? null, anterior?.atingimento ?? null),
    tendencia: computeTrend(realizadosSerie),
    quality: atual && analyze ? analyze(atual, points) : [],
  };
}

/** Competências únicas presentes (mais recentes primeiro). */
export function allCompetencias(indicadores: IndicadorGeral[]): string[] {
  const set = new Set<string>();
  for (const r of indicadores) { const c = dateToCompetencia(r.competencia); if (c) set.add(c); }
  return [...set].sort((a, b) => (a < b ? 1 : -1));
}

/** Competência mais recente com dado, ou '' se não houver. */
export function latestCompetencia(indicadores: IndicadorGeral[]): string {
  return allCompetencias(indicadores)[0] ?? '';
}
