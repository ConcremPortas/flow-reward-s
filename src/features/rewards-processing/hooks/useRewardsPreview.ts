import { useCallback } from 'react';
import type { RewardsPreviewInputs, RewardsPreviewParams } from '../domain/rewardsPreview';
import { computeRewardsPreview } from '../domain/rewardsPreview';
import type { RewardsPreview } from '../types/rewards-processing.types';

/**
 * Fornece o cálculo da prévia SOB DEMANDA (puro, sem persistir). O componente
 * decide QUANDO executar (ao entrar na etapa de prévia) e guarda o resultado.
 */
export function useRewardsPreview(previewInputs: RewardsPreviewInputs) {
  return useCallback(
    (params: RewardsPreviewParams): RewardsPreview => computeRewardsPreview(params, previewInputs),
    [previewInputs],
  );
}
