import { RewardsProcessingShell } from '@/features/rewards-processing/components/RewardsProcessingShell';

/**
 * Rota /premiacoes/gerar-premiacoes — Central de Processamento de Premiações.
 * A orquestração vive na feature `rewards-processing`; esta página apenas monta
 * o shell. O motor de cálculo permanece em `@/domain/premiacao/calculoPremiacao`.
 */
const GerarPremiacoes = () => <RewardsProcessingShell />;

export default GerarPremiacoes;
