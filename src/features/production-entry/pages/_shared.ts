import type { UseProductionEntryReturn } from '../hooks/useProductionEntry';
import type { UseProductionDraftReturn } from '../hooks/useProductionDraft';
import type { ProductionView } from '../views';

/** Props compartilhadas pelas visões — dados/estado já processados pelo shell. */
export interface ProductionPageProps {
  data: UseProductionEntryReturn;
  draft: UseProductionDraftReturn;
  competencia: string;
  setCompetencia: (c: string) => void;
  comparing: boolean;
  setComparing: (v: boolean) => void;
  baselineAnterior: Record<string, { meta: number | null; realizado: number | null }>;
  reviewOpen: boolean;
  setReviewOpen: (v: boolean) => void;
  onGoToView: (v: ProductionView) => void;
  onImport: () => void;
}
