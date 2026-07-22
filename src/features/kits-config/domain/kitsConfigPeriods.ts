// Períodos efetivos e estado (Programada/Atual/Histórica) — PURO.
//
// Período efetivo de cada config: [vigência, mês anterior à próxima vigência).
// Sem próxima → "em diante". NÃO persiste data final artificial.
import { shiftCompetencia } from '@/features/dashboard/utils/dates';
import { selectConfigForCompetencia, type HasVigencia } from './kitsConfigSelection';
import type { KitsConfigPeriod, KitsConfigState } from '../types/kits-config.types';

export interface PeriodState { period: KitsConfigPeriod; state: KitsConfigState }

const STATE_META: Record<KitsConfigState['state'], Omit<KitsConfigState, 'state'>> = {
  programada: { label: 'Programada', variant: 'warning' },
  atual: { label: 'Atual', variant: 'success' },
  historica: { label: 'Histórica', variant: 'neutral' },
};

/**
 * Calcula período efetivo + estado para cada configuração.
 * @param configs itens com `id` e `vigenciaInicio` ('YYYY-MM').
 * @param competenciaAtual competência corrente ('YYYY-MM').
 */
export function computePeriodsAndStates<T extends HasVigencia & { id: string }>(
  configs: T[],
  competenciaAtual: string,
): Map<string, PeriodState> {
  const asc = [...configs].sort((a, b) => a.vigenciaInicio.localeCompare(b.vigenciaInicio));
  const atual = selectConfigForCompetencia(configs, competenciaAtual);
  const result = new Map<string, PeriodState>();

  asc.forEach((c, i) => {
    const next = asc[i + 1];
    const period: KitsConfigPeriod = next
      ? { inicio: c.vigenciaInicio, fim: shiftCompetencia(next.vigenciaInicio, -1), emDiante: false }
      : { inicio: c.vigenciaInicio, fim: null, emDiante: true };

    let stateKind: KitsConfigState['state'];
    if (c.vigenciaInicio > competenciaAtual) stateKind = 'programada';
    else if (atual && c.id === atual.id) stateKind = 'atual';
    else stateKind = 'historica';

    result.set(c.id, { period, state: { state: stateKind, ...STATE_META[stateKind] } });
  });

  return result;
}
