import { useMemo } from 'react';
import { useBasePremiacao } from '@/hooks/useBasePremiacao';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useFormulasCalculo } from '@/hooks/useFormulasCalculo';
import { useResultadosPremiacao } from '@/hooks/useResultadosPremiacao';
import { buildRewardBaseUsageMaps, usageFor } from '../domain/rewardBaseDependencies';
import { deriveEngineBehavior } from '../domain/rewardBaseDefinitions';
import { analyzeName } from '../domain/rewardBaseNameAnalysis';
import { getRewardBaseStatus } from '../domain/rewardBaseStatus';
import { normalizeForDuplicate } from '../domain/rewardBaseValidation';
import type { RewardBaseRow, RewardBaseTipo } from '../types/reward-base.types';

/**
 * Composição das fontes da Central de Bases. Constrói as linhas enriquecidas
 * (análise de nome + comportamento no motor + uso + status) uma vez, com vínculos
 * agregados em lote (sem N+1). Reexpõe create/update/delete (delete é soft).
 * Não altera o banco nem o motor.
 */
export function useRewardBases() {
  const { bases, loading, createBase, updateBase, deleteBase, refetch } = useBasePremiacao();
  const { funcionarios } = useFuncionarios();
  const { formulas } = useFormulasCalculo();
  const { resultados } = useResultadosPremiacao();

  const maps = useMemo(() => buildRewardBaseUsageMaps(funcionarios, formulas, resultados), [funcionarios, formulas, resultados]);

  const nomeCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of bases) m.set(normalizeForDuplicate(b.nome), (m.get(normalizeForDuplicate(b.nome)) ?? 0) + 1);
    return m;
  }, [bases]);

  const rows = useMemo<RewardBaseRow[]>(() => bases.map((b) => {
    const tipo: RewardBaseTipo = b.tipo === 'valor_fixo' ? 'valor_fixo' : 'percentual';
    const usage = usageFor(b, maps);
    const nameAnalysis = analyzeName(b.nome, tipo, b.valor_base);
    const engine = deriveEngineBehavior(b.nome);
    const duplicado = (nomeCount.get(normalizeForDuplicate(b.nome)) ?? 0) > 1;
    return {
      id: b.id, nome: b.nome, descricao: b.descricao ?? null, tipo, valorBase: b.valor_base,
      nameAnalysis, engine, usage,
      status: getRewardBaseStatus({ tipo: b.tipo, valorBase: b.valor_base, nameAnalysis, usage, duplicado }),
      duplicado,
    } satisfies RewardBaseRow;
  }), [bases, maps, nomeCount]);

  const rowById = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows]);

  // Totais GLOBAIS (distintos) das relações.
  const relationsTotals = useMemo(() => {
    const funcs = new Set<string>(), cats = new Set<string>();
    let formulasCount = 0;
    for (const s of maps.funcionarios.values()) s.forEach(x => funcs.add(x));
    for (const s of maps.categorias.values()) s.forEach(x => cats.add(x));
    for (const arr of maps.formulas.values()) formulasCount += arr.length;
    return { funcionarios: funcs.size, categorias: cats.size, formulas: formulasCount };
  }, [maps]);

  const findDuplicate = (nome: string, exceptId?: string): RewardBaseRow | undefined =>
    rows.find(r => r.id !== exceptId && normalizeForDuplicate(r.nome) === normalizeForDuplicate(nome));

  return { rows, rowById, relationsTotals, loading, createBase, updateBase, deleteBase, refetch, findDuplicate };
}

export type UseRewardBasesReturn = ReturnType<typeof useRewardBases>;
