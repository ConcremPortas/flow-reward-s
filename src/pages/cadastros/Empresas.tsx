import { CompaniesShell } from '@/features/companies/components/CompaniesShell';

/**
 * Rota /premiacoes/cadastros/empresas — Gestão de Empresas. A orquestração vive na
 * feature `companies`; esta página apenas monta o shell.
 */
export const Empresas = () => <CompaniesShell />;
