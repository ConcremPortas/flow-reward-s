// Qualidade dos dados — detecção de anomalias por regras EXPLÍCITAS e puras.
//
// Princípios (do pedido): não corrigir valores automaticamente; não trocar o
// status de negócio; exigir histórico mínimo para regras de escala; evitar falso
// positivo óbvio. Só SINALIZA "possível inconsistência" para revisão humana.
import type { DataQualitySignal, GeneralIndicatorPoint } from '../types/general-indicators.types';
import { median } from './indicatorCalculations';

export interface DataQualityConfig {
  /** Histórico mínimo (nº de pontos com realizado) para regras de escala. */
  minHistorico: number;
  /** Fator de distância da mediana para marcar outlier (ex.: 5 = 5x). */
  outlierFator: number;
  /** Acima deste valor, um indicador é considerado "de grande escala" (para pegar 1/0). */
  escalaGrande: number;
}

export const DEFAULT_QUALITY_CONFIG: DataQualityConfig = {
  minHistorico: 3,
  outlierFator: 5,
  escalaGrande: 1_000,
};

/**
 * Analisa um ponto contra o seu histórico. `historico` inclui (ou não) o próprio
 * ponto — a mediana de referência é calculada excluindo a competência analisada.
 */
export function analyzePoint(
  point: GeneralIndicatorPoint,
  historico: GeneralIndicatorPoint[],
  config: DataQualityConfig = DEFAULT_QUALITY_CONFIG,
): DataQualitySignal[] {
  const signals: DataQualitySignal[] = [];
  const { meta, realizado } = point;

  // Ausências / meta zero — sempre sinalizadas (não dependem de histórico).
  if (meta == null) signals.push({ severity: 'info', code: 'sem_meta', title: 'Meta ausente', message: 'Este registro não possui meta informada.' });
  if (realizado == null) signals.push({ severity: 'info', code: 'sem_realizado', title: 'Realizado ausente', message: 'Este registro não possui valor realizado informado.' });
  if (meta === 0) signals.push({ severity: 'warning', code: 'meta_zero', title: 'Meta igual a zero', message: 'Meta zero impede o cálculo de atingimento.' });

  // Referência histórica: realizados de OUTRAS competências.
  const referencias = historico.filter((p) => p.competencia !== point.competencia).map((p) => p.realizado);
  const med = median(referencias);
  const temHistorico = referencias.filter((v) => v != null).length >= config.minHistorico;

  if (temHistorico && med != null && med >= config.escalaGrande) {
    // Indicador historicamente de grande escala com valor "1" → placeholder provável.
    if (realizado === 1) {
      signals.push({ severity: 'warning', code: 'placeholder_um', title: 'Possível placeholder (realizado = 1)', message: 'Realizado igual a 1 em indicador historicamente de grande escala. Pode representar ausência de medição.', currentValue: 1, referenceValue: med });
    }
    if (meta === 1) {
      signals.push({ severity: 'warning', code: 'placeholder_um', title: 'Possível placeholder (meta = 1)', message: 'Meta igual a 1 em indicador historicamente de grande escala. Pode representar ausência de medição.', currentValue: 1, referenceValue: med });
    }
  }

  // Outlier de escala: valor muito distante da mediana histórica.
  if (temHistorico && med != null && med > 0 && realizado != null && realizado !== 1) {
    const ratio = realizado / med;
    if (ratio >= config.outlierFator || ratio <= 1 / config.outlierFator) {
      signals.push({
        severity: 'warning',
        code: ratio >= config.outlierFator ? 'scale_change' : 'outlier',
        title: 'Possível mudança de escala',
        message: `Realizado muito distante da mediana histórica (${ratio >= 1 ? `${ratio.toFixed(1)}× acima` : `${(1 / ratio).toFixed(1)}× abaixo`}).`,
        currentValue: realizado,
        referenceValue: med,
      });
    }
  }

  return signals;
}

/** Há algum sinal de anomalia relevante (severidade warning)? */
export function hasAnomaly(signals: DataQualitySignal[]): boolean {
  return signals.some((s) => s.severity === 'warning');
}
