import { useMemo } from 'react';
import type { GeneralIndicatorCardData } from '../types/general-indicators.types';
import { buildInsights } from '../domain/indicatorInsights';

/** Insights determinísticos da competência (memoizados). */
export function useGeneralIndicatorInsights(cards: GeneralIndicatorCardData[]) {
  return useMemo(() => buildInsights(cards), [cards]);
}
