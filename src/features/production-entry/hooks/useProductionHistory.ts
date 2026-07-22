import { useMemo } from 'react';
import type { ProducaoSetor } from '@/hooks/useProducaoSetor';
import type { Setor } from '@/hooks/useSetores';
import type { ProductionHistoryRow } from '../types/production-entry.types';
import { calcularPercentual, calcularDesvio, dateToCompetencia } from '../domain/productionCalculations';
import { classifySituacao } from '../domain/productionStatus';

/**
 * Constrói as linhas do Histórico a partir de TODOS os registros de produção
 * (exceto indicadores 'percentual'). Cada registro salvo vira uma linha com a
 * sua competência. Situação derivada pela mesma regra da apuração.
 */
export function useProductionHistory(registros: ProducaoSetor[], setores: Setor[]): ProductionHistoryRow[] {
  return useMemo(() => {
    const setorById = new Map(setores.map((s) => [s.id, s]));
    return registros
      .filter((r) => r.unidade_medida !== 'percentual')
      .map((r) => {
        const setor = r.setor_id ? setorById.get(r.setor_id) : undefined;
        const meta = r.meta_diaria ?? null;
        const realizado = r.producao_realizada ?? null;
        const percentual = calcularPercentual(realizado, meta);
        return {
          setorId: r.setor_id ?? '',
          setorNome: setor?.nome ?? r.setor?.nome ?? 'Setor não encontrado',
          empresaId: setor?.empresa_id ?? null,
          empresaNome: setor?.empresa?.nome ?? r.setor?.empresa?.nome ?? null,
          unidade: r.unidade_medida || 'unidades',
          meta,
          realizado,
          percentual,
          desvio: calcularDesvio(realizado, meta),
          situacao: classifySituacao(percentual, true),
          registroId: r.id,
          temRegistro: true,
          observacoes: r.observacoes ?? null,
          competencia: dateToCompetencia(r.data_producao),
        } satisfies ProductionHistoryRow;
      })
      .sort((a, b) => (a.competencia === b.competencia ? a.setorNome.localeCompare(b.setorNome) : a.competencia < b.competencia ? 1 : -1));
  }, [registros, setores]);
}
