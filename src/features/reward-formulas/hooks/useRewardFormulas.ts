import { useMemo } from 'react';
import { useFormulasCalculo } from '@/hooks/useFormulasCalculo';
import { useCategorias } from '@/hooks/useCategorias';
import { useBasePremiacao } from '@/hooks/useBasePremiacao';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { getWeights } from '../domain/rewardFormulaWeights';
import { validateFormulaWeights } from '../domain/rewardFormulaValidation';
import { buildFormulaUsageMap, usageFor } from '../domain/rewardFormulaDependencies';
import { getFormulaStatus } from '../domain/rewardFormulaStatus';
import type { RewardFormulaRow } from '../types/reward-formula.types';

/**
 * Composição das fontes da Central de Fórmulas. Constrói as linhas enriquecidas
 * (pesos + validação + utilização derivada + situação + duplicidade) uma vez, em
 * lote (sem N+1). Reexpõe create/update/delete (delete é soft). Não altera o motor.
 */
export function useRewardFormulas() {
  const { formulas, loading, createFormula, updateFormula, deleteFormula, refetch } = useFormulasCalculo();
  const { categorias } = useCategorias();
  const { bases } = useBasePremiacao();
  const { funcionarios } = useFuncionarios();

  const usageMap = useMemo(() => buildFormulaUsageMap(funcionarios), [funcionarios]);

  // Duplicidade: combinações (categoria_id, base_premiacao_id) com >1 fórmula ativa.
  const comboCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of formulas) {
      if (!f.categoria_id || !f.base_premiacao_id) continue;
      const k = `${f.categoria_id}|${f.base_premiacao_id}`;
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return m;
  }, [formulas]);

  const rows = useMemo<RewardFormulaRow[]>(() => formulas.map((f) => {
    const weights = getWeights(f);
    const validation = validateFormulaWeights(weights);
    const usage = usageFor(f.categoria_id ?? null, f.base_premiacao_id ?? null, usageMap);
    const temAplicacao = !!f.categoria_id && !!f.base_premiacao_id;
    const duplicado = temAplicacao && (comboCount.get(`${f.categoria_id}|${f.base_premiacao_id}`) ?? 0) > 1;
    return {
      id: f.id, nome: f.nome, descricao: f.descricao ?? null,
      categoriaId: f.categoria_id ?? null, baseId: f.base_premiacao_id ?? null,
      categoriaNome: f.categoria?.nome ?? null, baseNome: f.base_premiacao?.nome ?? null,
      multiplicadorKits: f.multiplicador_kits ?? null,
      weights, validation, usage,
      status: getFormulaStatus({ validation, usage, duplicado, temAplicacao }),
      duplicado,
    } satisfies RewardFormulaRow;
  }), [formulas, usageMap, comboCount]);

  const rowById = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows]);

  /** Fórmulas ativas que atendem a mesma combinação (categoria, base). */
  const findByCombo = (categoriaId: string | null, baseId: string | null, exceptId?: string): RewardFormulaRow[] => {
    if (!categoriaId || !baseId) return [];
    return rows.filter(r => r.id !== exceptId && r.categoriaId === categoriaId && r.baseId === baseId);
  };

  const categoriaOptions = useMemo(() => categorias.map(c => ({ id: c.id, nome: c.nome })), [categorias]);
  const baseOptions = useMemo(() => bases.map(b => ({ id: b.id, nome: b.nome })), [bases]);

  return {
    rows, rowById, loading, categoriaOptions, baseOptions,
    createFormula, updateFormula, deleteFormula, refetch, findByCombo,
  };
}

export type UseRewardFormulasReturn = ReturnType<typeof useRewardFormulas>;
