import { GeneralIndicatorTypesShell } from '@/features/general-indicator-types/components/GeneralIndicatorTypesShell';

/**
 * Rota /premiacoes/cadastros/tipos-indicadores-gerais — Gestão de Indicadores
 * Gerais. A orquestração vive na feature `general-indicator-types`; esta página
 * apenas monta o shell. (Distinta de Tipos de Indicadores Setoriais.)
 */
export const TiposIndicadoresGerais = () => <GeneralIndicatorTypesShell />;
