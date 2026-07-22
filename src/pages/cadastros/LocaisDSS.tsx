import { DssLocationsShell } from '@/features/dss-locations/components/DssLocationsShell';

/**
 * Rota /premiacoes/cadastros/locais-dss — Gestão de Locais de DSS. A orquestração
 * vive na feature `dss-locations`; esta página apenas monta o shell.
 */
export const LocaisDSS = () => <DssLocationsShell />;
