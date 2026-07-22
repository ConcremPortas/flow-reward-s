// Comparação entre competências — puras.
// Distingue explicitamente VARIAÇÃO DO REALIZADO (%) de VARIAÇÃO DO ATINGIMENTO
// (pontos percentuais) — nunca confundir as duas.
import type { GeneralIndicatorPoint } from '../types/general-indicators.types';
import { calcularVariacao, calcularVariacaoPP } from './indicatorCalculations';

export interface ComparisonRow {
  tipoId: string;
  codigo: string;
  label: string;
  realizadoAnterior: number | null;
  realizadoAtual: number | null;
  variacaoRealizado: number | null; // % de variação do valor realizado
  atingimentoAnterior: number | null;
  atingimentoAtual: number | null;
  variacaoPP: number | null;         // pontos percentuais de atingimento
}

/** Compara um indicador entre duas competências a partir dos seus pontos. */
export function compareIndicator(
  points: GeneralIndicatorPoint[],
  competenciaAtual: string,
  competenciaAnterior: string,
  meta: { tipoId: string; codigo: string; label: string },
): ComparisonRow {
  const byComp = new Map(points.map((p) => [p.competencia, p]));
  const atual = byComp.get(competenciaAtual) ?? null;
  const anterior = byComp.get(competenciaAnterior) ?? null;
  return {
    ...meta,
    realizadoAnterior: anterior?.realizado ?? null,
    realizadoAtual: atual?.realizado ?? null,
    variacaoRealizado: calcularVariacao(atual?.realizado ?? null, anterior?.realizado ?? null),
    atingimentoAnterior: anterior?.atingimento ?? null,
    atingimentoAtual: atual?.atingimento ?? null,
    variacaoPP: calcularVariacaoPP(atual?.atingimento ?? null, anterior?.atingimento ?? null),
  };
}
