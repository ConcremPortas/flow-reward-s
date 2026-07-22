import { useMemo } from 'react';
import { useFaixas } from '@/hooks/useFaixas';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useResultadosPremiacao } from '@/hooks/useResultadosPremiacao';
import { buildUsageMaps, usageFor } from '../domain/bonusTierDependencies';
import { analyzeName } from '../domain/bonusTierNameAnalysis';
import { getTierRegistrationStatus } from '../domain/bonusTierRegistrationStatus';
import { normalizeStr } from '../domain/bonusTierPresentation';
import type { BonusTierRow } from '../types/bonus-tier.types';

/**
 * Composição das fontes da Central de Faixas. Constrói as linhas enriquecidas
 * (análise de nome + uso + status) uma vez, com vínculos agregados em lote
 * (sem N+1). Reexpõe create/update/delete (delete é soft).
 */
export function useBonusTiers() {
  const { faixas, loading, createFaixa, updateFaixa, deleteFaixa, refetch } = useFaixas();
  const { funcionarios } = useFuncionarios();
  const { resultados } = useResultadosPremiacao();

  const maps = useMemo(() => buildUsageMaps(funcionarios, resultados), [funcionarios, resultados]);

  // Contagem por nome normalizado (para sinalizar duplicidade).
  const nomeCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const f of faixas) m.set(normalizeStr(f.nome), (m.get(normalizeStr(f.nome)) ?? 0) + 1);
    return m;
  }, [faixas]);

  const rows = useMemo<BonusTierRow[]>(() => faixas.map((f) => {
    const usage = usageFor(f, maps);
    const nameAnalysis = analyzeName(f.nome, f.valor);
    const duplicado = (nomeCount.get(normalizeStr(f.nome)) ?? 0) > 1;
    return {
      id: f.id, nome: f.nome, valor: f.valor, categoriaId: f.categoria_id ?? null,
      nameAnalysis, usage,
      status: getTierRegistrationStatus({ usage, nameAnalysis, duplicado }),
    } satisfies BonusTierRow;
  }), [faixas, maps, nomeCount]);

  // Totais GLOBAIS (distintos) das relações — união dos conjuntos por faixa.
  const relationsTotals = useMemo(() => {
    const cats = new Set<string>(), funcs = new Set<string>(), bs = new Set<string>();
    for (const s of maps.categorias.values()) s.forEach(x => cats.add(x));
    for (const s of maps.funcionarios.values()) s.forEach(x => funcs.add(x));
    for (const s of maps.bases.values()) s.forEach(x => bs.add(x));
    return { categorias: cats.size, funcionarios: funcs.size, bases: bs.size };
  }, [maps]);

  /** Duplicidade app-level (não há constraint no banco): mesmo nome normalizado. */
  const findDuplicate = (nome: string, exceptId?: string): BonusTierRow | undefined =>
    rows.find(r => r.id !== exceptId && normalizeStr(r.nome) === normalizeStr(nome));

  return { rows, relationsTotals, loading, createFaixa, updateFaixa, deleteFaixa, refetch, findDuplicate };
}

export type UseBonusTiersReturn = ReturnType<typeof useBonusTiers>;
