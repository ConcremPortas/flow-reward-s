import { SectorIndicatorsShell } from '@/features/sector-indicators/components/SectorIndicatorsShell';

/**
 * Rota /premiacoes/indicadores-setor — Central Operacional de Apuração dos
 * Indicadores por Setor. A orquestração vive na feature `sector-indicators`;
 * esta página apenas monta o shell.
 */
export const IndicadoresSetor = () => <SectorIndicatorsShell />;
