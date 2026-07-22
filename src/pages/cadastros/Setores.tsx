import { SectorsShell } from '@/features/sectors/components/SectorsShell';

/**
 * Rota /premiacoes/cadastros/setores (e /cargos-salarios/cadastros/setores) —
 * Central de Estrutura Organizacional. A orquestração vive na feature `sectors`;
 * esta página apenas monta o shell.
 */
export const Setores = () => <SectorsShell />;
