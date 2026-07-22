import type { UseEpiDataReturn } from '@/features/epi/hooks/useEpiData';
import type { UseEpiAuditReturn } from '@/features/epi/hooks/useEpiAudit';
import type { UseEpiIndicatorsReturn } from '@/features/epi/hooks/useEpiIndicators';

/** Props compartilhadas pelas 4 visões — recebem os dados/estado já processados pelo shell. */
export interface EpiPageProps {
  data: UseEpiDataReturn;
  audit: UseEpiAuditReturn;
  indicators: UseEpiIndicatorsReturn;
  onCancelAudit: () => void;
  onGoToView: (view: 'auditoria' | 'nao-conformidades' | 'historico' | 'indicadores') => void;
}
