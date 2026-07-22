import { BonusTiersShell } from '@/features/bonus-tiers/components/BonusTiersShell';

/**
 * Rota /premiacoes/cadastros/faixas — Central de Faixas de Premiação. A
 * orquestração vive na feature `bonus-tiers`; esta página apenas monta o shell.
 */
export const Faixas = () => <BonusTiersShell />;
