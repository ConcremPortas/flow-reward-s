import { useMemo } from 'react';
import { useTiposIndicadoresGerais } from '@/hooks/useTiposIndicadoresGerais';
import { useIndicadoresGerais } from '@/hooks/useIndicadoresGerais';
import { buildTypeMeasurementUsage, usageForType } from '../domain/generalIndicatorTypeCodeUsage';
import { getGeneralIndicatorTypeStatus } from '../domain/generalIndicatorTypeStatus';
import { resolveIndicatorDefinition } from '../domain/generalIndicatorValueFormatting';
import { isValidCodigo, isValidNome, normalizeCodigo, normalizeNome } from '../domain/generalIndicatorTypeValidation';
import type { GeneralIndicatorTypeRow } from '../types/general-indicator-type.types';

/**
 * Composição das fontes da Gestão de Indicadores Gerais. Constrói as linhas
 * enriquecidas (utilização real via FK + definição por código + situação) uma vez,
 * em lote (sem N+1). Reexpõe create/update/delete. Distinto dos SETORIAIS.
 * Não altera o banco nem o motor.
 */
export function useGeneralIndicatorTypes() {
  const { tiposIndicadores, loading, createTipoIndicador, updateTipoIndicador, deleteTipoIndicador, refetch } = useTiposIndicadoresGerais();
  const { indicadores } = useIndicadoresGerais();

  const stats = useMemo(() => buildTypeMeasurementUsage(indicadores), [indicadores]);

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

  const rows = useMemo<GeneralIndicatorTypeRow[]>(() => tiposIndicadores.map((t) => {
    const usage = usageForType(t.id, stats);
    const duplicadoCodigo = (codigoCount.get(normalizeCodigo(t.codigo)) ?? 0) > 1;
    const duplicadoNome = (nomeCount.get(normalizeNome(t.nome)) ?? 0) > 1;
    return {
      id: t.id, codigo: t.codigo, nome: t.nome, descricao: t.descricao ?? null, ativo: t.ativo,
      definition: resolveIndicatorDefinition(t.codigo, t.nome),
      usage,
      status: getGeneralIndicatorTypeStatus({ codigoValido: isValidCodigo(t.codigo), nomeInformado: isValidNome(t.nome), usage, duplicadoCodigo }),
      duplicadoCodigo, duplicadoNome,
    } satisfies GeneralIndicatorTypeRow;
  }), [tiposIndicadores, stats, codigoCount, nomeCount]);

  const rowById = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows]);

  /** Duplicidade app-level por código normalizado. */
  const findByCodigo = (codigo: string, exceptId?: string): GeneralIndicatorTypeRow | undefined =>
    rows.find(r => r.id !== exceptId && normalizeCodigo(r.codigo) === normalizeCodigo(codigo));

  return { rows, rowById, loading, createTipoIndicador, updateTipoIndicador, deleteTipoIndicador, refetch, findByCodigo };
}

export type UseGeneralIndicatorTypesReturn = ReturnType<typeof useGeneralIndicatorTypes>;
