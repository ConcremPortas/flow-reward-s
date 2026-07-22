import type { UseSectorIndicatorsReturn } from '../hooks/useSectorIndicators';
import type { UseSectorIndicatorsDraftReturn } from '../hooks/useSectorIndicatorsDraft';
import type { UseSectorIndicatorsSelectionReturn } from '../hooks/useSectorIndicatorsSelection';
import type { SectorIndicatorDraftMap } from '../types/sector-indicators.types';
import type { SectorIndicatorView } from '../views';

/** Props compartilhadas pelas visões — dados/estado já processados pelo shell. */
export interface SectorIndicatorsPageProps {
  data: UseSectorIndicatorsReturn;
  draft: UseSectorIndicatorsDraftReturn;
  selection: UseSectorIndicatorsSelectionReturn;
  competencia: string;
  setCompetencia: (c: string) => void;
  comparing: boolean;
  baselineAnterior: SectorIndicatorDraftMap;
  reviewOpen: boolean;
  setReviewOpen: (v: boolean) => void;
  onGoToView: (v: SectorIndicatorView) => void;
  onVerIndicadoresGerais: (params?: { setorId?: string; competencia?: string }) => void;
}
