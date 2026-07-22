import { useMemo } from 'react';
import type { IndicadorSetor } from '@/hooks/useIndicadoresSetor';
import type { Setor } from '@/hooks/useSetores';
import type { SectorIndicatorHistoryRow } from '../types/sector-indicators.types';
import {
  buildEntryFromRegistro, buildSectorRows, dateToCompetencia,
} from '../domain/indicatorCalculations';

/**
 * Constrói as linhas do Histórico a partir de TODOS os registros de indicadores.
 * Cada registro salvo vira uma linha com a sua competência. Reaproveita o mesmo
 * derivador (buildSectorRows) da matriz, alimentando-o com um "setor previsto" e
 * um draft de um único setor por registro — garante situação/percentuais idênticos.
 */
export function useSectorIndicatorsHistory(indicadores: IndicadorSetor[], setores: Setor[]): SectorIndicatorHistoryRow[] {
  return useMemo(() => {
    const setorById = new Map(setores.map((s) => [s.id, s]));
    return indicadores
      .filter((r) => !!r.setor_id)
      .map((reg) => {
        const setorId = reg.setor_id!;
        const setor = setorById.get(setorId) ?? ({
          id: setorId,
          nome: reg.setor?.nome ?? 'Setor não encontrado',
          ativo: true,
          empresa_id: undefined,
        } as Setor);
        const entry = buildEntryFromRegistro(reg);
        const [row] = buildSectorRows({
          setoresPrevistos: [setor],
          draft: { [setorId]: entry },
          registroIdIndex: { [setorId]: reg.id },
        });
        return { ...row, competencia: dateToCompetencia(reg.competencia) } satisfies SectorIndicatorHistoryRow;
      })
      .sort((a, b) => (a.competencia === b.competencia ? a.setorNome.localeCompare(b.setorNome) : a.competencia < b.competencia ? 1 : -1));
  }, [indicadores, setores]);
}
