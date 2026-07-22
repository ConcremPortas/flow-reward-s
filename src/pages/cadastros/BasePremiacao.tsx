import { RewardBasesShell } from '@/features/reward-bases/components/RewardBasesShell';

/**
 * Rota /premiacoes/cadastros/base-premiacao — Central de Bases de Premiação. A
 * orquestração vive na feature `reward-bases`; esta página apenas monta o shell.
 */
export const BasePremiacao = () => <RewardBasesShell />;
