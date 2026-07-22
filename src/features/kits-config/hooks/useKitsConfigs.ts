import { useMemo } from 'react';
import { useConfiguracoesKits } from '@/hooks/useConfiguracoesKits';
import { useResultadosPremiacao } from '@/hooks/useResultadosPremiacao';
import { currentCompetencia } from '@/features/dashboard/utils/dates';
import { computePeriodsAndStates } from '../domain/kitsConfigPeriods';
import { buildConfigUsage, competenciasAfetadasPorRetroatividade } from '../domain/kitsConfigDependencies';
import { isSentinela, selectConfigForCompetencia } from '../domain/kitsConfigSelection';
import type { KitsConfigRow } from '../types/kits-config.types';

/**
 * Composição das fontes da Central de Kits. Constrói linhas enriquecidas (período
 * efetivo + estado + utilização derivada) uma vez, em lote (sem N+1). Reexpõe
 * create/update/delete (delete é soft). Não altera o motor nem o banco.
 */
export function useKitsConfigs() {
  const { configuracoes, loading, createConfiguracao, updateConfiguracao, deleteConfiguracao, refetch } = useConfiguracoesKits();
  const { resultados } = useResultadosPremiacao();

  const competenciaAtual = useMemo(() => currentCompetencia(), []);

  // Base normalizada (id + vigenciaInicio 'YYYY-MM') para os domínios puros.
  const bases = useMemo(
    () => configuracoes.map(c => ({ id: c.id, vigenciaInicio: (c.vigencia_inicio ?? '').slice(0, 7) })),
    [configuracoes],
  );

  const periods = useMemo(() => computePeriodsAndStates(bases, competenciaAtual), [bases, competenciaAtual]);
  const usageMap = useMemo(() => buildConfigUsage(bases, resultados), [bases, resultados]);

  const vigCount = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of bases) m.set(b.vigenciaInicio, (m.get(b.vigenciaInicio) ?? 0) + 1);
    return m;
  }, [bases]);

  const rows = useMemo<KitsConfigRow[]>(() => configuracoes.map((c) => {
    const vig = (c.vigencia_inicio ?? '').slice(0, 7);
    const ps = periods.get(c.id)!;
    return {
      id: c.id, vigenciaInicio: vig,
      minimoKits: c.minimo_kits, incrementoFaixa: c.incremento_faixa,
      bonusBase: c.bonus_base, bonusPorFaixa: c.bonus_por_faixa,
      maxFaixas: c.max_faixas ?? null,
      createdAt: c.created_at ?? null, updatedAt: c.updated_at ?? null,
      sentinela: isSentinela(vig),
      period: ps.period, state: ps.state,
      usage: usageMap.get(c.id)!,
      duplicado: (vigCount.get(vig) ?? 0) > 1,
    } satisfies KitsConfigRow;
  }), [configuracoes, periods, usageMap, vigCount]);

  // Ordem decrescente por vigência (linha do tempo).
  const rowsDesc = useMemo(() => [...rows].sort((a, b) => b.vigenciaInicio.localeCompare(a.vigenciaInicio)), [rows]);
  const rowById = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows]);

  const atual = useMemo(() => {
    const sel = selectConfigForCompetencia(bases, competenciaAtual);
    return sel ? rowById.get(sel.id) ?? null : null;
  }, [bases, competenciaAtual, rowById]);

  const proxima = useMemo(() => {
    const futuras = rowsDesc.filter(r => r.state.state === 'programada');
    return futuras.length ? futuras[futuras.length - 1] : null; // programada mais próxima
  }, [rowsDesc]);

  const findByVigencia = (vigencia: string, exceptId?: string): KitsConfigRow | undefined =>
    rows.find(r => r.id !== exceptId && r.vigenciaInicio === vigencia.slice(0, 7));

  /** Competências já processadas afetadas se a vigência for retroativa. */
  const retroFor = (vigencia: string) => competenciasAfetadasPorRetroatividade(resultados, vigencia);

  return {
    rows: rowsDesc, rowById, atual, proxima, competenciaAtual, loading,
    createConfiguracao, updateConfiguracao, deleteConfiguracao, refetch, findByVigencia, retroFor,
  };
}

export type UseKitsConfigsReturn = ReturnType<typeof useKitsConfigs>;
