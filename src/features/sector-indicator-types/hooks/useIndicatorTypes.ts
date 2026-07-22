import { useMemo } from 'react';
import { useTiposIndicadores } from '@/hooks/useTiposIndicadores';
import { useIndicadoresSetor } from '@/hooks/useIndicadoresSetor';
import { buildMeasurementUsage, usageForCode } from '../domain/indicatorTypeCodeUsage';
import { getIndicatorTypeStatus } from '../domain/indicatorTypeStatus';
import { isValidCodigo, isValidNome, normalizeCodigo, normalizeNome } from '../domain/indicatorTypeValidation';
import type { IndicatorTypeRow } from '../types/indicator-type.types';

/**
 * Composição das fontes da Gestão de Indicadores Setoriais. Constrói as linhas
 * enriquecidas (utilização por correspondência código↔coluna + situação) uma vez,
 * com agregação em lote (sem N+1). Reexpõe create/update/delete (delete é soft).
 * Não altera o banco nem o motor. Distinto dos indicadores GERAIS.
 */
export function useIndicatorTypes() {
  const { tiposIndicadores, loading, createTipoIndicador, updateTipoIndicador, deleteTipoIndicador, refetch } = useTiposIndicadores();
  const { indicadores } = useIndicadoresSetor();

  const stats = useMemo(() => buildMeasurementUsage(indicadores), [indicadores]);

  const codigoCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tiposIndicadores) m.set(normalizeCodigo(t.codigo), (m.get(normalizeCodigo(t.codigo)) ?? 0) + 1);
    return m;
  }, [tiposIndicadores]);

  const nomeCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const t of tiposIndicadores) m.set(normalizeNome(t.nome), (m.get(normalizeNome(t.nome)) ?? 0) + 1);
    return m;
  }, [tiposIndicadores]);

  const rows = useMemo<IndicatorTypeRow[]>(() => tiposIndicadores.map((t) => {
    const usage = usageForCode(t.codigo, stats);
    const duplicadoCodigo = (codigoCount.get(normalizeCodigo(t.codigo)) ?? 0) > 1;
    const duplicadoNome = (nomeCount.get(normalizeNome(t.nome)) ?? 0) > 1;
    return {
      id: t.id, codigo: t.codigo, nome: t.nome, descricao: t.descricao ?? null, ativo: t.ativo,
      usage,
      status: getIndicatorTypeStatus({ ativo: t.ativo, codigoValido: isValidCodigo(t.codigo), nomeInformado: isValidNome(t.nome), usage, duplicadoCodigo }),
      duplicadoCodigo, duplicadoNome,
    } satisfies IndicatorTypeRow;
  }), [tiposIndicadores, stats, codigoCount, nomeCount]);

  const rowById = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows]);

  /** Duplicidade app-level por código normalizado (não há constraint garantida no banco). */
  const findByCodigo = (codigo: string, exceptId?: string): IndicatorTypeRow | undefined =>
    rows.find(r => r.id !== exceptId && normalizeCodigo(r.codigo) === normalizeCodigo(codigo));

  return { rows, rowById, loading, createTipoIndicador, updateTipoIndicador, deleteTipoIndicador, refetch, findByCodigo };
}

export type UseIndicatorTypesReturn = ReturnType<typeof useIndicatorTypes>;
