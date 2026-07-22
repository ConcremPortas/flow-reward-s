// Inteligência de premiações. Consome resultados já calculados pelo motor de
// domínio (NÃO recalcula premiação). A decomposição de perda por critério é uma
// ESTIMATIVA baseada nas notas persistidas, claramente rotulada na UI.
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { RewardsIntel, RewardsFaixa, RewardsRankItem, WaterfallStep, RewardsSimulation } from './types';
import { resultadosDaCompetencia } from './utils/rewards';

const CRITERIOS: { key: string; label: string; nota: (r: ResultadoPremiacao) => number | null | undefined }[] = [
  { key: 'producao', label: 'Produção', nota: r => r.nota_producao },
  { key: 'epi', label: 'EPI', nota: r => r.nota_epi },
  { key: 'faltas', label: 'Faltas', nota: r => r.nota_faltas },
  { key: 'advertencias', label: 'Advertências', nota: r => r.nota_advertencias },
  { key: 'dss', label: 'DSS', nota: r => r.nota_dss },
];

export function buildRewardsIntel(
  resultados: ResultadoPremiacao[],
  comp: string,
  funcsScoped: Funcionario[],
  setorNames?: Set<string>,
): RewardsIntel {
  const rows = resultadosDaCompetencia(resultados, comp, setorNames);

  const potencial = rows.reduce((a, r) => a + (r.bonus_possivel || 0), 0);
  const projetado = rows.reduce((a, r) => a + (r.bonus_alcancado || 0), 0);
  const medio = rows.length ? projetado / rows.length : 0;
  const elegiveis = rows.length;
  const ativos = funcsScoped.filter(f => f.ativo).length;
  const naoElegiveis = Math.max(0, ativos - elegiveis);

  // Distribuição por faixa
  const faixaMap = new Map<string, { count: number; total: number }>();
  rows.forEach(r => {
    const k = r.faixa || '—';
    const cur = faixaMap.get(k) || { count: 0, total: 0 };
    cur.count += 1; cur.total += r.bonus_alcancado || 0;
    faixaMap.set(k, cur);
  });
  const faixas: RewardsFaixa[] = [...faixaMap].map(([faixa, v]) => ({ faixa, count: v.count, total: v.total }))
    .sort((a, b) => b.total - a.total);

  // Ranking por setor
  const setorMap = new Map<string, { total: number; count: number }>();
  rows.forEach(r => {
    const k = r.setor || '—';
    const cur = setorMap.get(k) || { total: 0, count: 0 };
    cur.total += r.bonus_alcancado || 0; cur.count += 1;
    setorMap.set(k, cur);
  });
  const ranking: RewardsRankItem[] = [...setorMap].map(([setor, v]) => ({ setor, total: v.total, count: v.count }))
    .sort((a, b) => b.total - a.total).slice(0, 8);

  // Perda por critério (estimativa) — distribui o gap proporcional a (1 - nota)
  const perda: Record<string, number> = {};
  CRITERIOS.forEach(c => { perda[c.key] = 0; });
  rows.forEach(r => {
    const gap = (r.bonus_possivel || 0) - (r.bonus_alcancado || 0);
    if (gap <= 0) return;
    const pesos = CRITERIOS.map(c => {
      const n = c.nota(r);
      return { key: c.key, w: n == null ? 0 : Math.max(0, 1 - n) };
    });
    const somaW = pesos.reduce((a, p) => a + p.w, 0);
    if (somaW <= 0) return;
    pesos.forEach(p => { perda[p.key] += gap * (p.w / somaW); });
  });
  const perdaPorCriterio = CRITERIOS.map(c => ({ criterio: c.label, valor: Number(perda[c.key].toFixed(2)) }))
    .filter(p => p.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  // Waterfall: potencial → perdas → projetado
  const waterfall: WaterfallStep[] = [
    { key: 'potencial', label: 'Potencial', value: potencial, kind: 'base' },
    ...CRITERIOS.filter(c => perda[c.key] > 0).map(c => ({
      key: c.key, label: `Perda ${c.label}`, value: -Number(perda[c.key].toFixed(2)), kind: 'loss' as const,
    })),
    { key: 'projetado', label: 'Projetado', value: projetado, kind: 'result' },
  ];

  // Simulações (cenários) — recuperável se o critério atingisse 100%
  const simulacoes: RewardsSimulation[] = perdaPorCriterio.slice(0, 4).map(p => ({
    key: p.criterio, label: `Se ${p.criterio} atingir 100%`, recuperavel: p.valor,
  }));

  return {
    potencial, projetado, aprovado: null, medio, elegiveis, naoElegiveis,
    faixas, ranking, waterfall, perdaPorCriterio, simulacoes,
  };
}
