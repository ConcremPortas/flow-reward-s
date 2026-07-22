// Regras de SITUAÇÃO de negócio dos indicadores gerais — puras.
//
// AUDITORIA: a tela legada usava percentual >=100 (superada), >=95 (próximo),
// <95 (abaixo). O pedido exige cinco badges (superada/atingida/atenção/abaixo/
// sem dados). Definimos limiares explícitos e documentados sobre o ATINGIMENTO
// (direção-aware): superada >= 105, atingida >= 100, atenção >= 90, abaixo < 90.
import type { GeneralSituacao, IndicatorDirection } from '../types/general-indicators.types';

export const LIMITE_SUPERADA = 105;
export const LIMITE_ATINGIDA = 100;
export const LIMITE_ATENCAO = 90;

/**
 * Atingimento de exibição (escala 0-100), direção-aware.
 * higher_is_better: realizado/meta*100 · lower_is_better: meta/realizado*100.
 * Retorna null quando não calculável (meta/realizado ausente ou divisor <= 0).
 */
export function calcularAtingimento(
  realizado: number | null,
  meta: number | null,
  direction: IndicatorDirection,
): number | null {
  if (realizado == null || meta == null) return null;
  if (direction === 'lower_is_better') {
    if (realizado <= 0) return null;
    return (meta / realizado) * 100;
  }
  if (meta <= 0) return null;
  return (realizado / meta) * 100;
}

export function classifyGeneralSituacao(atingimento: number | null, hasData: boolean): GeneralSituacao {
  if (!hasData || atingimento == null) return 'sem_dados';
  if (atingimento >= LIMITE_SUPERADA) return 'superada';
  if (atingimento >= LIMITE_ATINGIDA) return 'atingida';
  if (atingimento >= LIMITE_ATENCAO) return 'atencao';
  return 'abaixo';
}

export const SITUACAO_META: Record<GeneralSituacao, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  superada: { label: 'Meta superada', variant: 'success' },
  atingida: { label: 'Meta atingida', variant: 'success' },
  atencao: { label: 'Atenção', variant: 'warning' },
  abaixo: { label: 'Abaixo da meta', variant: 'danger' },
  sem_dados: { label: 'Sem dados', variant: 'neutral' },
};

export function situacaoLabel(s: GeneralSituacao): string {
  return SITUACAO_META[s].label;
}
