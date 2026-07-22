import { CategoriesShell } from '@/features/categories/components/CategoriesShell';

/**
 * Rota /premiacoes/cadastros/categorias — Gestão de Categorias. A orquestração
 * vive na feature `categories`; esta página apenas monta o shell.
 */
export const Categorias = () => <CategoriesShell />;
