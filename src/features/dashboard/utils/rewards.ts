// Agregações de premiação — puro. Consome resultados já persistidos
// (motor de cálculo do domínio NÃO é duplicado aqui).
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';

export interface RewardsTotals {
  count: number;
  possivel: number;
  alcancado: number;
  valorFinal: number;   // com ajuste manual, quando houver
  medio: number;
}

/** Resultados da competência ('YYYY-MM' -> mes_competencia 'YYYY-MM-01'). */
export function resultadosDaCompetencia(
  resultados: ResultadoPremiacao[],
  comp: string,
  setoresNomes?: Set<string>,
): ResultadoPremiacao[] {
  const alvo = comp ? `${comp}-01` : '';
  return resultados.filter(r =>
    (!alvo || r.mes_competencia === alvo) &&
    (!setoresNomes || (r.setor != null && setoresNomes.has(r.setor))),
  );
}

export function rewardsTotals(rows: ResultadoPremiacao[]): RewardsTotals {
  const count = rows.length;
  const possivel = rows.reduce((a, r) => a + (r.bonus_possivel || 0), 0);
  const alcancado = rows.reduce((a, r) => a + (r.bonus_alcancado || 0), 0);
  const valorFinal = rows.reduce((a, r) => a + (r.valor_ajustado ?? r.bonus_alcancado ?? 0), 0);
  return {
    count,
    possivel,
    alcancado,
    valorFinal,
    medio: count > 0 ? alcancado / count : 0,
  };
}
