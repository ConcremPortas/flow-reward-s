import { useMemo } from 'react';
import { useLocaisDSS } from '@/hooks/useLocaisDSS';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useDSS } from '@/hooks/useDSS';
import { buildDssLocationUsageMaps, usageFor } from '../domain/dssLocationDependencies';
import { getDssLocationStatus } from '../domain/dssLocationStatus';
import { shouldShowDescription, normalizeStr } from '../domain/dssLocationPresentation';
import { normalizeForDuplicate } from '../domain/dssLocationValidation';
import type { DssLocationRow } from '../types/dss-location.types';

/**
 * Composição das fontes da Gestão de Locais de DSS. Constrói as linhas
 * enriquecidas (cobertura + histórico + situação) uma vez, em lote (sem N+1).
 * Reexpõe create/update/delete (delete é soft). Não altera o banco nem o motor.
 */
export function useDssLocations() {
  const { locais, loading, createLocal, updateLocal, deleteLocal, refetch } = useLocaisDSS();
  const { funcionarios } = useFuncionarios();
  const { dssRecords } = useDSS();

  const maps = useMemo(() => buildDssLocationUsageMaps(funcionarios, dssRecords), [funcionarios, dssRecords]);

  const nomeCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of locais) m.set(normalizeForDuplicate(l.nome), (m.get(normalizeForDuplicate(l.nome)) ?? 0) + 1);
    return m;
  }, [locais]);

  const rows = useMemo<DssLocationRow[]>(() => locais.map((l) => {
    const usage = usageFor(l, maps);
    const duplicado = (nomeCount.get(normalizeForDuplicate(l.nome)) ?? 0) > 1;
    return {
      id: l.id, nome: l.nome, descricao: l.descricao ?? null,
      mostrarDescricao: shouldShowDescription(l.nome, l.descricao),
      usage,
      status: getDssLocationStatus({ usage, duplicado }),
      duplicado,
    } satisfies DssLocationRow;
  }), [locais, maps, nomeCount]);

  const rowById = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows]);
  const funcionariosSemLocal = maps.semLocal;

  /** Duplicidade app-level (caixa/espaços). */
  const findDuplicate = (nome: string, exceptId?: string): DssLocationRow | undefined =>
    rows.find(r => r.id !== exceptId && normalizeStr(r.nome) === normalizeStr(nome));

  return { rows, rowById, funcionariosSemLocal, loading, createLocal, updateLocal, deleteLocal, refetch, findDuplicate };
}

export type UseDssLocationsReturn = ReturnType<typeof useDssLocations>;
