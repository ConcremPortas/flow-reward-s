import { useMemo } from 'react';
import { useCategorias } from '@/hooks/useCategorias';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useFaixas } from '@/hooks/useFaixas';
import { useFormulasCalculo } from '@/hooks/useFormulasCalculo';
import { useResultadosPremiacao } from '@/hooks/useResultadosPremiacao';
import { buildCategoryUsageMaps, usageFor, deriveUtilizacao } from '../domain/categoryUsage';
import { normalizeForDuplicate } from '../domain/categoryValidation';
import type { CategoryRow } from '../types/category.types';

/**
 * Composição das fontes da Gestão de Categorias. Constrói as linhas enriquecidas
 * (utilização + vínculos) uma vez, com agregação em lote (sem N+1). Reexpõe
 * create/update/delete (delete é soft). Não altera o banco nem o motor.
 */
export function useCategories() {
  const { categorias, loading, createCategoria, updateCategoria, deleteCategoria, refetch } = useCategorias();
  const { funcionarios } = useFuncionarios();
  const { faixas } = useFaixas();
  const { formulas } = useFormulasCalculo();
  const { resultados } = useResultadosPremiacao();

  const maps = useMemo(
    () => buildCategoryUsageMaps(funcionarios, faixas, formulas, resultados),
    [funcionarios, faixas, formulas, resultados],
  );

  const nomeCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of categorias) m.set(normalizeForDuplicate(c.nome), (m.get(normalizeForDuplicate(c.nome)) ?? 0) + 1);
    return m;
  }, [categorias]);

  const rows = useMemo<CategoryRow[]>(() => categorias.map((c) => {
    const usage = usageFor(c, maps);
    return {
      id: c.id, nome: c.nome, descricao: c.descricao ?? null,
      usage, utilizacao: deriveUtilizacao(usage),
      duplicado: (nomeCount.get(normalizeForDuplicate(c.nome)) ?? 0) > 1,
    } satisfies CategoryRow;
  }), [categorias, maps, nomeCount]);

  const rowById = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows]);

  /** Duplicidade app-level: mesmo nome normalizado (caixa/espaços). */
  const findDuplicate = (nome: string, exceptId?: string): CategoryRow | undefined =>
    rows.find(r => r.id !== exceptId && normalizeForDuplicate(r.nome) === normalizeForDuplicate(nome));

  return { rows, rowById, loading, createCategoria, updateCategoria, deleteCategoria, refetch, findDuplicate };
}

export type UseCategoriesReturn = ReturnType<typeof useCategories>;
