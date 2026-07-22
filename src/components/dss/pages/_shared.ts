import type { UseDssDataReturn } from '@/features/dss/hooks/useDssData';
import type { UseDssRegistrationReturn } from '@/features/dss/hooks/useDssRegistration';
import type { UseDssIndicatorsReturn } from '@/features/dss/hooks/useDssIndicators';

/** Props compartilhadas pelas 3 visões — recebem os dados/estado já processados pelo shell. */
export interface DssPageProps {
  data: UseDssDataReturn;
  registration: UseDssRegistrationReturn;
  indicators: UseDssIndicatorsReturn;
  onCancelRegistration: () => void;
  onGoToView: (view: 'registro' | 'historico' | 'indicadores') => void;
}
