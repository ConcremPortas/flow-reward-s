// Métricas financeiras do relatório — puras. Semântica idêntica à tela legada.
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { FinancialTotals } from '../types/rewards-report.types';

/** Valor final = ajuste manual quando existe; senão, bônus alcançado. */
export function valorFinal(r: ResultadoPremiacao): number {
  return r.valor_ajustado ?? r.bonus_alcancado ?? 0;
}

/** Diferença = valor final − bônus possível (negativo = perda de potencial). */
export function diferenca(r: ResultadoPremiacao): number {
  return valorFinal(r) - (r.bonus_possivel || 0);
}

/** Este resultado tem ajuste manual (valor_ajustado preenchido)? */
export function temAjuste(r: ResultadoPremiacao): boolean {
  return r.valor_ajustado != null && r.valor_ajustado !== (r.bonus_alcancado ?? 0);
}

/** Totais consolidados de um conjunto de resultados (linhas). */
export function computeTotals(rows: ResultadoPremiacao[]): FinancialTotals {
  const possivel = rows.reduce((s, r) => s + (r.bonus_possivel || 0), 0);
  const alcancado = rows.reduce((s, r) => s + (r.bonus_alcancado || 0), 0);
  const final = rows.reduce((s, r) => s + valorFinal(r), 0);
  const funcionarios = new Set(rows.map(r => r.funcionario_id).filter(Boolean));
  const setores = new Set(rows.map(r => r.setor).filter(Boolean));
  const bases = new Set(rows.map(r => r.base_premiacao_id).filter(Boolean));
  const categorias = new Set(rows.map(r => r.categoria).filter(Boolean));
  const comBonus = rows.filter(r => valorFinal(r) > 0).length;
  return {
    resultados: rows.length,
    funcionariosUnicos: funcionarios.size,
    setores: setores.size,
    bases: bases.size,
    categorias: categorias.size,
    possivel,
    alcancado,
    final,
    ajustes: final - alcancado,
    diferenca: final - possivel,
    temAjustes: rows.some(temAjuste),
    atingimento: possivel > 0 ? (final / possivel) * 100 : null,
    comBonus,
    semBonus: rows.length - comBonus,
  };
}
