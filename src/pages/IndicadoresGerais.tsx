import { GeneralIndicatorsShell } from '@/features/general-indicators/components/GeneralIndicatorsShell';

/**
 * Rota /premiacoes/indicadores-gerais — Central de Indicadores Corporativos.
 * A orquestração vive na feature `general-indicators`; esta página apenas monta
 * o shell.
 */
export const IndicadoresGerais = () => <GeneralIndicatorsShell />;
