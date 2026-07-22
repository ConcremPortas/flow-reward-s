import { useMemo } from 'react';
import type { RewardsPreviewInputs, RewardsPreviewParams } from '../domain/rewardsPreview';
import { buildValidation } from '../domain/rewardsValidation';

/** Validação (preflight) memoizada para o escopo atual. */
export function useRewardsValidation(
  params: RewardsPreviewParams,
  previewInputs: RewardsPreviewInputs,
  categorias: { id: string; nome: string }[],
) {
  return useMemo(
    () => buildValidation(params, { ...previewInputs, categorias }),
    [params, previewInputs, categorias],
  );
}
