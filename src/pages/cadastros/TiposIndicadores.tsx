import { IndicatorTypesShell } from '@/features/sector-indicator-types/components/IndicatorTypesShell';

/**
 * Rota /premiacoes/cadastros/tipos-indicadores — Gestão de Indicadores Setoriais.
 * A orquestração vive na feature `sector-indicator-types`; esta página apenas
 * monta o shell. (Distinta de Tipos de Indicadores Gerais.)
 */
export const TiposIndicadores = () => <IndicatorTypesShell />;
