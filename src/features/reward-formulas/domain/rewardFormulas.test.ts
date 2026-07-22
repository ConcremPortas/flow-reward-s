import { describe, it, expect } from 'vitest';
import { getWeights, sumWeights, activeCriteria, topCriteria } from './rewardFormulaWeights';
import { validateFormulaWeights, WEIGHT_TOLERANCE, isValidFormulaName } from './rewardFormulaValidation';
import { buildFormulaUsageMap, usageFor, hasActiveLinks } from './rewardFormulaDependencies';
import { getFormulaStatus } from './rewardFormulaStatus';
import { buildCoverage, cellAt, coverageCounts } from './rewardFormulaCoverage';
import { diffWeights } from './rewardFormulaComparison';
import { matchesFormulaFilters, computeFormulaSummary, countActiveFormulaFilters } from './rewardFormulaFilters';
import { DEFAULT_REWARD_FORMULA_FILTERS, type RewardFormulaRow } from '../types/reward-formula.types';
import type { FormulaCalculo } from '@/hooks/useFormulasCalculo';
import type { Funcionario } from '@/hooks/useFuncionarios';

const ZERO = {
  peso_producao_setor: 0, peso_faturamento: 0, peso_epi: 0, peso_faltas: 0, peso_dss: 0,
  peso_itens_nc: 0, peso_advertencias: 0, peso_tratamento_nc: 0, peso_hora_maquina: 0,
  peso_operacao_segura: 0, peso_limpeza: 0,
};
const formula = (over: Partial<FormulaCalculo> & { id: string; nome: string }): FormulaCalculo => ({
  ...ZERO, multiplicador_kits: null, ativo: true, created_at: '', updated_at: '', ...over,
} as FormulaCalculo);
const emp = (over: Partial<Funcionario> & { id: string }): Funcionario => ({ nome: 'X', ativo: true, created_at: '', updated_at: '', ...over });

// ---------- pesos ----------
describe('pesos', () => {
  it('getWeights trata null como 0; soma correta', () => {
    const w = getWeights(formula({ id: 'f', nome: 'x', peso_producao_setor: 60, peso_epi: 15, peso_faltas: null }));
    expect(w.peso_producao_setor).toBe(60);
    expect(w.peso_faltas).toBe(0);
    expect(sumWeights(w)).toBe(75);
  });
  it('activeCriteria e topCriteria (desc)', () => {
    const w = getWeights(formula({ id: 'f', nome: 'x', peso_producao_setor: 60, peso_epi: 15, peso_faltas: 10, peso_dss: 10, peso_advertencias: 5 }));
    expect(activeCriteria(w).length).toBe(5);
    const { top, rest } = topCriteria(w, 3);
    expect(top[0].key).toBe('peso_producao_setor');
    expect(top.map(t => t.value)).toEqual([60, 15, 10]);
    expect(rest).toBe(2);
  });
});

// ---------- validação (soma/tolerância/decimais) ----------
describe('validateFormulaWeights', () => {
  const w = (o: Partial<Record<string, number>>) => getWeights(formula({ id: 'f', nome: 'x', ...o } as never));
  it('100% exato → válido, sem faltante/excedente', () => {
    const v = validateFormulaWeights(w({ peso_producao_setor: 60, peso_epi: 15, peso_faltas: 10, peso_dss: 10, peso_advertencias: 5 }));
    expect(v.valid).toBe(true);
    expect(v.total).toBe(100);
    expect(v.missing).toBe(0);
    expect(v.excess).toBe(0);
    expect(v.activeCriteria).toBe(5);
  });
  it('abaixo de 100 → missing', () => {
    const v = validateFormulaWeights(w({ peso_producao_setor: 85 }));
    expect(v.valid).toBe(false);
    expect(v.missing).toBe(15);
  });
  it('acima de 100 → excess', () => {
    const v = validateFormulaWeights(w({ peso_producao_setor: 60, peso_epi: 60 }));
    expect(v.valid).toBe(false);
    expect(v.excess).toBe(20);
  });
  it('decimais dentro da tolerância → válido', () => {
    const v = validateFormulaWeights(w({ peso_producao_setor: 33.34, peso_epi: 33.33, peso_faltas: 33.33 }));
    expect(v.total).toBe(100);
    expect(v.valid).toBe(true);
    expect(WEIGHT_TOLERANCE).toBeGreaterThan(0);
  });
  it('todos zerados → inválido', () => {
    const v = validateFormulaWeights(w({}));
    expect(v.valid).toBe(false);
    expect(v.activeCriteria).toBe(0);
  });
  it('nome obrigatório', () => {
    expect(isValidFormulaName('  ')).toBe(false);
    expect(isValidFormulaName('Auxiliar - KITS')).toBe(true);
  });
});

// ---------- utilização ----------
describe('utilização (por categoria×base, sem N+1)', () => {
  const funcionarios = [
    emp({ id: 'e1', categoria_id: 'c1', base_premiacao_id: 'b1', ativo: true }),
    emp({ id: 'e2', categoria_id: 'c1', base_premiacao_id: 'b1', ativo: true }),
    emp({ id: 'e3', categoria_id: 'c1', base_premiacao_id: 'b2', ativo: true }),
    emp({ id: 'e4', categoria_id: 'c1', base_premiacao_id: 'b1', ativo: false }),
  ];
  it('conta funcionários ativos da combinação', () => {
    const map = buildFormulaUsageMap(funcionarios);
    expect(usageFor('c1', 'b1', map).funcionarios).toBe(2);
    expect(usageFor('c1', 'b2', map).emUso).toBe(true);
    expect(usageFor('c9', 'b9', map).funcionarios).toBe(0);
    expect(hasActiveLinks(usageFor('c1', 'b1', map))).toBe(true);
    expect(hasActiveLinks(usageFor('c9', 'b9', map))).toBe(false);
  });
});

// ---------- situação ----------
describe('getFormulaStatus', () => {
  const okValidation = validateFormulaWeights(getWeights(formula({ id: 'f', nome: 'x', peso_producao_setor: 100 })));
  const badValidation = validateFormulaWeights(getWeights(formula({ id: 'f', nome: 'x', peso_producao_setor: 85 })));
  it('regular', () => {
    expect(getFormulaStatus({ validation: okValidation, usage: { funcionarios: 3, emUso: true }, duplicado: false, temAplicacao: true }).status).toBe('regular');
  });
  it('incompleta (soma ≠ 100)', () => {
    expect(getFormulaStatus({ validation: badValidation, usage: { funcionarios: 0, emUso: false }, duplicado: false, temAplicacao: true }).status).toBe('incompleta');
  });
  it('possível duplicidade tem prioridade', () => {
    expect(getFormulaStatus({ validation: okValidation, usage: { funcionarios: 3, emUso: true }, duplicado: true, temAplicacao: true }).status).toBe('possivel_duplicidade');
  });
  it('revisar quando sem categoria/base', () => {
    expect(getFormulaStatus({ validation: okValidation, usage: { funcionarios: 0, emUso: false }, duplicado: false, temAplicacao: false }).status).toBe('revisar');
  });
});

// ---------- cobertura ----------
describe('buildCoverage', () => {
  const cats = [{ id: 'c1', nome: 'Auxiliar' }, { id: 'c2', nome: 'Encarregado' }];
  const bases = [{ id: 'b1', nome: 'PRODUÇÃO' }, { id: 'b2', nome: 'KITS' }];
  const mkRow = (over: Partial<RewardFormulaRow> & { id: string; categoriaId: string | null; baseId: string | null }): RewardFormulaRow => ({
    nome: 'F', descricao: null, categoriaNome: null, baseNome: null, multiplicadorKits: null,
    weights: getWeights(formula({ id: 'x', nome: 'x', peso_producao_setor: 100 })),
    validation: validateFormulaWeights(getWeights(formula({ id: 'x', nome: 'x', peso_producao_setor: 100 }))),
    usage: { funcionarios: 0, emUso: false }, status: { status: 'regular', motivos: [], descricao: '' }, duplicado: false, ...over,
  });
  const incompleta = mkRow({ id: 'f-inc', categoriaId: 'c2', baseId: 'b1', validation: validateFormulaWeights(getWeights(formula({ id: 'x', nome: 'x', peso_producao_setor: 50 }))) });
  const rows = [
    mkRow({ id: 'f1', categoriaId: 'c1', baseId: 'b1' }),
    mkRow({ id: 'f2a', categoriaId: 'c1', baseId: 'b2' }),
    mkRow({ id: 'f2b', categoriaId: 'c1', baseId: 'b2' }), // duplicada
    incompleta,
  ];
  it('estados das células', () => {
    const cov = buildCoverage(cats, bases, rows);
    expect(cellAt(cov, 'c1', 'b1')!.state).toBe('configurada');
    expect(cellAt(cov, 'c1', 'b2')!.state).toBe('duplicada');
    expect(cellAt(cov, 'c1', 'b2')!.formulaIds).toEqual(['f2a', 'f2b']);
    expect(cellAt(cov, 'c2', 'b1')!.state).toBe('incompleta');
    expect(cellAt(cov, 'c2', 'b2')!.state).toBe('sem_formula');
    expect(coverageCounts(cov)).toMatchObject({ configuradas: 1, duplicadas: 1, incompletas: 1, semFormula: 1, total: 4 });
  });
});

// ---------- comparação ----------
describe('diffWeights', () => {
  it('marca diferenças por critério', () => {
    const a = getWeights(formula({ id: 'a', nome: 'a', peso_producao_setor: 60, peso_epi: 15 }));
    const b = getWeights(formula({ id: 'b', nome: 'b', peso_producao_setor: 50, peso_epi: 25 }));
    const diff = diffWeights(a, b);
    const prod = diff.find(d => d.key === 'peso_producao_setor')!;
    expect(prod).toMatchObject({ a: 60, b: 50, changed: true });
    expect(diff.find(d => d.key === 'peso_faltas')!.changed).toBe(false);
  });
});

// ---------- filtros/resumo ----------
describe('filtros e resumo', () => {
  const base = (over: Partial<RewardFormulaRow> & { id: string }): RewardFormulaRow => ({
    nome: 'Auxiliar - PRODUÇÃO', descricao: null, categoriaId: 'c1', baseId: 'b1', categoriaNome: 'Auxiliar', baseNome: 'PRODUÇÃO',
    multiplicadorKits: null, weights: getWeights(formula({ id: 'x', nome: 'x', peso_producao_setor: 100 })),
    validation: validateFormulaWeights(getWeights(formula({ id: 'x', nome: 'x', peso_producao_setor: 100 }))),
    usage: { funcionarios: 5, emUso: true }, status: { status: 'regular', motivos: [], descricao: '' }, duplicado: false, ...over,
  });
  const f1 = base({ id: 'f1' });
  const f2 = base({ id: 'f2', nome: 'Encarregado - KITS', categoriaId: 'c2', baseId: 'b2', categoriaNome: 'Encarregado', baseNome: 'KITS', usage: { funcionarios: 0, emUso: false }, status: { status: 'incompleta', motivos: [], descricao: '' } });
  const rows = [f1, f2];

  it('busca por nome/categoria/base', () => {
    expect(matchesFormulaFilters(f1, { ...DEFAULT_REWARD_FORMULA_FILTERS, search: 'auxiliar' })).toBe(true);
    expect(matchesFormulaFilters(f1, { ...DEFAULT_REWARD_FORMULA_FILTERS, search: 'produção' })).toBe(true);
    expect(matchesFormulaFilters(f2, { ...DEFAULT_REWARD_FORMULA_FILTERS, search: 'auxiliar' })).toBe(false);
  });
  it('filtro por categoria, base, situação, utilização', () => {
    expect(matchesFormulaFilters(f1, { ...DEFAULT_REWARD_FORMULA_FILTERS, categoriaId: 'c1' })).toBe(true);
    expect(matchesFormulaFilters(f1, { ...DEFAULT_REWARD_FORMULA_FILTERS, baseId: 'b2' })).toBe(false);
    expect(matchesFormulaFilters(f2, { ...DEFAULT_REWARD_FORMULA_FILTERS, situacao: 'incompleta' })).toBe(true);
    expect(matchesFormulaFilters(f1, { ...DEFAULT_REWARD_FORMULA_FILTERS, utilizacao: 'em_uso' })).toBe(true);
    expect(matchesFormulaFilters(f2, { ...DEFAULT_REWARD_FORMULA_FILTERS, utilizacao: 'sem_vinculo' })).toBe(true);
    expect(countActiveFormulaFilters({ ...DEFAULT_REWARD_FORMULA_FILTERS, categoriaId: 'c1', utilizacao: 'em_uso' })).toBe(2);
  });
  it('resumo', () => {
    expect(computeFormulaSummary(rows)).toMatchObject({ total: 2, emUso: 1, combinacoesCobertas: 2, aRevisar: 1, incompletas: 1, duplicidades: 0 });
  });
});
