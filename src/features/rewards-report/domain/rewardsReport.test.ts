import { describe, it, expect } from 'vitest';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { BasePremiacao } from '@/hooks/useBasePremiacao';
import { valorFinal, diferenca, temAjuste, computeTotals } from './rewardsReportMetrics';
import { groupByBase, groupBySetor, sortGroups } from './rewardsReportGrouping';
import { classifyByKey } from './rewardsCriterionState';
import { matchesReportFilters, DEFAULT_REPORT_FILTERS, countActiveReportFilters } from './rewardsReportFilters';
import { buildFunnel, criterionImpacts, largestDifferences, distributionByFaixa } from './rewardsReconciliation';

const mk = (over: Partial<ResultadoPremiacao>): ResultadoPremiacao => ({
  id: over.id || 'r1', mes_competencia: '2026-05-01', base_premiacao_id: 'b1', funcionario_id: 'f1', nome: 'João',
  setor: 'Montagem', funcao: 'Op', categoria: 'Auxiliar', faixa: 'Faixa 100%',
  nota_epi: 1, nota_faltas: 1, nota_advertencias: 1, nota_dss: 1, nota_geral: 0.9,
  bonus_possivel: 1000, bonus_alcancado: 900, created_at: '', updated_at: '', ...over,
});

describe('métricas — semântica auditada', () => {
  it('valor final = ajuste quando existe; senão alcançado', () => {
    expect(valorFinal(mk({ bonus_alcancado: 900 }))).toBe(900);
    expect(valorFinal(mk({ bonus_alcancado: 900, valor_ajustado: 950 }))).toBe(950);
  });
  it('Final == Alcançado quando não há ajuste (temAjuste=false)', () => {
    const r = mk({ bonus_alcancado: 900 });
    expect(temAjuste(r)).toBe(false);
    expect(valorFinal(r)).toBe(r.bonus_alcancado);
  });
  it('diferença = final − possível (negativa = perda de potencial)', () => {
    expect(diferenca(mk({ bonus_possivel: 1000, bonus_alcancado: 900 }))).toBe(-100);
  });
  it('totais distinguem resultados (linhas) de funcionários únicos', () => {
    const rows = [mk({ id: 'a', funcionario_id: 'f1', base_premiacao_id: 'b1' }), mk({ id: 'b', funcionario_id: 'f1', base_premiacao_id: 'b2' }), mk({ id: 'c', funcionario_id: 'f2' })];
    const t = computeTotals(rows);
    expect(t.resultados).toBe(3);
    expect(t.funcionariosUnicos).toBe(2); // f1 em 2 bases conta 1 pessoa
  });
  it('atingimento = final/possível*100; null se possível<=0', () => {
    expect(computeTotals([mk({ bonus_possivel: 1000, bonus_alcancado: 900 })]).atingimento).toBeCloseTo(90, 5);
    expect(computeTotals([mk({ bonus_possivel: 0, bonus_alcancado: 0 })]).atingimento).toBeNull();
  });
  it('ajustes somam final − alcançado', () => {
    const t = computeTotals([mk({ bonus_alcancado: 900, valor_ajustado: 950 })]);
    expect(t.temAjustes).toBe(true);
    expect(t.ajustes).toBe(50);
  });
});

describe('agrupamentos', () => {
  const bases: BasePremiacao[] = [{ id: 'b1', nome: 'KIT 100%', valor_base: 0, tipo: 'kits', ativo: true, created_at: '', updated_at: '' }];
  it('por base com funcionários únicos', () => {
    const g = groupByBase([mk({ funcionario_id: 'f1' }), mk({ id: 'b', funcionario_id: 'f1' }), mk({ id: 'c', funcionario_id: 'f2' })], bases);
    expect(g[0].resultados).toBe(3);
    expect(g[0].funcionariosUnicos).toBe(2);
    expect(g[0].label).toBe('KIT 100%');
  });
  it('por setor e ordenação por diferença (mais negativa primeiro)', () => {
    const g = groupBySetor([mk({ setor: 'A', bonus_possivel: 1000, bonus_alcancado: 500 }), mk({ id: 'b', setor: 'B', bonus_possivel: 1000, bonus_alcancado: 950 })]);
    const sorted = sortGroups(g, 'diferenca');
    expect(sorted[0].label).toBe('A'); // -500 antes de -50
  });
});

describe('estado de critério — desambigua "—"', () => {
  it('valor presente → valor', () => {
    expect(classifyByKey(mk({ nota_epi: 0.8 }), 'epi').kind).toBe('valor');
  });
  it('opcional ausente → não aplicável', () => {
    expect(classifyByKey(mk({ nota_producao: undefined }), 'producao').kind).toBe('nao_aplicavel');
    expect(classifyByKey(mk({ nota_faturamento: undefined }), 'faturamento').kind).toBe('nao_aplicavel');
  });
  it('presente com valor → valor (produção)', () => {
    expect(classifyByKey(mk({ nota_producao: 0.75 }), 'producao').value).toBe(0.75);
  });
});

describe('filtros', () => {
  it('competência/base/situação/critério impactado', () => {
    const r = mk({ nota_epi: 0.7, bonus_alcancado: 900 });
    expect(matchesReportFilters(r, { ...DEFAULT_REPORT_FILTERS, competencia: '2026-05' })).toBe(true);
    expect(matchesReportFilters(r, { ...DEFAULT_REPORT_FILTERS, competencia: '2026-06' })).toBe(false);
    expect(matchesReportFilters(r, { ...DEFAULT_REPORT_FILTERS, situacao: 'sem_bonus' })).toBe(false);
    expect(matchesReportFilters(r, { ...DEFAULT_REPORT_FILTERS, criterios: { epi: true } })).toBe(true);
    expect(matchesReportFilters(mk({ nota_epi: 1 }), { ...DEFAULT_REPORT_FILTERS, criterios: { epi: true } })).toBe(false);
  });
  it('contagem de filtros ativos', () => {
    expect(countActiveReportFilters({ ...DEFAULT_REPORT_FILTERS, baseId: 'b1', situacao: 'sem_bonus' })).toBe(2);
  });
});

describe('conciliação', () => {
  const rows = [mk({ id: 'a', bonus_possivel: 1000, bonus_alcancado: 800, nota_epi: 0.5 }), mk({ id: 'b', funcionario_id: 'f2', bonus_possivel: 1000, bonus_alcancado: 1000 })];
  it('funil tem etapas reais (sem ajustes → sem etapa de ajustes)', () => {
    const funnel = buildFunnel(computeTotals(rows));
    expect(funnel.map(s => s.key)).toEqual(['possivel', 'perda', 'alcancado', 'final']);
  });
  it('funil inclui ajustes quando existem', () => {
    const funnel = buildFunnel(computeTotals([mk({ bonus_alcancado: 900, valor_ajustado: 950 })]));
    expect(funnel.some(s => s.key === 'ajustes')).toBe(true);
  });
  it('impacto por critério = resultados com nota < 1 (operacional)', () => {
    const imp = criterionImpacts(rows).find(i => i.key === 'epi')!;
    expect(imp.resultadosImpactados).toBe(1);
    expect(imp.funcionariosUnicos).toBe(1);
  });
  it('maiores diferenças ordena por mais negativa', () => {
    const d = largestDifferences(rows);
    expect(d[0].diferenca).toBeLessThanOrEqual(0);
  });
  it('distribuição por faixa separa "Sem premiação"', () => {
    const dist = distributionByFaixa([mk({ bonus_alcancado: 0 }), mk({ id: 'b', bonus_alcancado: 500 })]);
    expect(dist.some(d => d.faixa === 'Sem premiação')).toBe(true);
  });
});
