import { describe, it, expect } from 'vitest';
import {
  normalizeStr, comparisonKey, tokenKey, similarityRatio, levenshtein,
} from './functionNameNormalization';
import { analyzeFunctionName, toPersistedName } from './functionNameAnalysis';
import { classifyPair, buildSimilarityMatches, buildSimilarityGroups, type SimNameItem } from './functionSimilarity';
import { getFunctionRegistrationStatus } from './functionRegistrationStatus';
import { buildFunctionUsageMaps, usageFor, hasActiveLinks } from './functionDependencies';
import { isValidFunctionName } from './functionValidation';
import {
  matchesFunctionFilters, matchesFunctionTab, countActiveFunctionFilters,
  computeFunctionSummary, functionTabCounts,
} from './functionFilters';
import { DEFAULT_FUNCTION_FILTERS, type FunctionRow } from '../types/function.types';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { Funcao } from '@/hooks/useFuncoes';

// ---------- helpers ----------
const funcao = (over: Partial<Funcao> & { id: string; nome: string }): Funcao => ({
  ativo: true, created_at: '', updated_at: '', ...over,
});
const emp = (over: Partial<Funcionario> & { id: string }): Funcionario => ({
  nome: 'X', ativo: true, created_at: '', updated_at: '', ...over,
});
const res = (funcaoNome: string): ResultadoPremiacao => ({
  id: Math.random().toString(36), mes_competencia: '2026-05-01', nome: 'x', funcao: funcaoNome,
  nota_epi: 1, nota_faltas: 1, nota_advertencias: 1, nota_dss: 1, nota_geral: 1,
  bonus_possivel: 0, bonus_alcancado: 0, created_at: '', updated_at: '',
} as ResultadoPremiacao);

// ---------- normalização ----------
describe('normalização de nomes', () => {
  it('normalizeStr apara, minúscula, remove acento e colapsa espaços', () => {
    expect(normalizeStr('  AUXILIAR   DE  PRODUÇÃO ')).toBe('auxiliar de producao');
  });
  it('comparisonKey ignora acento, caixa e separadores', () => {
    expect(comparisonKey('MECÂNICO INDUSTRIAL - B')).toBe(comparisonKey('MECANICO INDUSTRIAL B'));
  });
  it('tokenKey é invariante à ordem das palavras', () => {
    expect(tokenKey('AJUSTADOR MECANICO')).toBe(tokenKey('mecanico ajustador'));
  });
  it('levenshtein e similarityRatio', () => {
    expect(levenshtein('abc', 'abc')).toBe(0);
    expect(levenshtein('abc', 'abd')).toBe(1);
    expect(similarityRatio('', '')).toBe(1);
    expect(similarityRatio('producao', 'producai')).toBeGreaterThan(0.8);
  });
});

// ---------- qualidade do nome ----------
describe('analyzeFunctionName', () => {
  it('nome limpo não tem problemas', () => {
    expect(analyzeFunctionName('AUXILIAR DE PRODUÇÃO').hasIssues).toBe(false);
  });
  it('detecta espaços nas extremidades', () => {
    const q = analyzeFunctionName(' AUXILIAR ');
    expect(q.hasIssues).toBe(true);
    expect(q.issues.some(i => i.kind === 'espacos_extremidades')).toBe(true);
  });
  it('detecta espaços duplicados no meio', () => {
    const q = analyzeFunctionName('AUXILIAR  DE PRODUCAO');
    expect(q.issues.some(i => i.kind === 'espacos_duplicados')).toBe(true);
  });
  it('toPersistedName apenas apara (não altera caixa/acento)', () => {
    expect(toPersistedName('  Auxiliar de Produção ')).toBe('Auxiliar de Produção');
  });
});

// ---------- classificação de pares ----------
describe('classifyPair', () => {
  it('diferença apenas de acentuação → high', () => {
    const c = classifyPair('AUXILIAR DE PRODUCAO', 'AUXILIAR DE PRODUÇÃO');
    expect(c?.type).toBe('accent_difference');
    expect(c?.confidence).toBe('high');
    expect(c?.diffs).toContain('Acentuação');
  });
  it('diferença apenas de caixa → high', () => {
    const c = classifyPair('Marceneiro', 'MARCENEIRO');
    expect(c?.type).toBe('case_difference');
    expect(c?.confidence).toBe('high');
  });
  it('diferença de separador (hífen) → high', () => {
    const c = classifyPair('MECANICO D', 'MECANICO - D');
    expect(c?.type).toBe('separator_difference');
  });
  it('acento + separador combinados → normalization_difference', () => {
    const c = classifyPair('MECANICO INDUSTRIAL B', 'MECÂNICO INDUSTRIAL - B');
    expect(c?.type).toBe('normalization_difference');
    expect(c?.diffs).toEqual(expect.arrayContaining(['Acentuação', 'Separador']));
  });
  it('mesmos tokens em ordem diferente → token_equivalent', () => {
    const c = classifyPair('AJUSTADOR MECANICO', 'MECANICO AJUSTADOR');
    expect(c?.type).toBe('token_equivalent');
    expect(c?.confidence).toBe('high');
  });
  it('nome muito semelhante → similar_name (média)', () => {
    const c = classifyPair('AUXILIAR DE PRODUCAO', 'AUXILIAR DE PRODUCAI');
    expect(c?.type).toBe('similar_name');
    expect(c?.confidence).toBe('medium');
  });
  it('nomes diferentes → null', () => {
    expect(classifyPair('AFIADOR DE FERRAMENTAS', 'MECANICO INDUSTRIAL')).toBeNull();
  });
});

// ---------- correspondências e grupos ----------
describe('buildSimilarityMatches / buildSimilarityGroups', () => {
  const items: SimNameItem[] = [
    { id: 'a', nome: 'AUXILIAR DE PRODUCAO' },
    { id: 'b', nome: 'AUXILIAR DE PRODUÇÃO' },
    { id: 'c', nome: 'MECANICO INDUSTRIAL B' },
    { id: 'd', nome: 'MECÂNICO INDUSTRIAL - B' },
    { id: 'e', nome: 'AFIADOR DE FERRAMENTAS' },
  ];
  const usage = (id: string) => ({ funcionarios: id === 'a' ? 84 : id === 'b' ? 12 : 4, setores: 3 });

  it('cada correspondência aponta para a outra função com nº de funcionários', () => {
    const m = buildSimilarityMatches(items, usage);
    expect(m.get('a')?.[0].targetId).toBe('b');
    expect(m.get('a')?.[0].targetFuncionarios).toBe(12);
    expect(m.get('e')).toBeUndefined(); // sem correspondência
  });
  it('agrupa por componentes conexos (2 grupos, ignora o isolado)', () => {
    const groups = buildSimilarityGroups(items, usage);
    expect(groups).toHaveLength(2);
    // grupo maior primeiro; membros ordenados por nº de funcionários
    const g0 = groups[0];
    expect(g0.members.map(x => x.id)).toEqual(['a', 'b']);
    expect(g0.members[0].funcionarios).toBe(84);
    expect(g0.diffs).toContain('Acentuação');
  });
});

// ---------- situação cadastral ----------
describe('getFunctionRegistrationStatus', () => {
  const nq = (issues = false) => (issues
    ? { issues: [{ kind: 'espacos_duplicados' as const, label: 'x' }], hasIssues: true }
    : { issues: [], hasIssues: false });

  it('regular quando limpo e sem correspondência', () => {
    expect(getFunctionRegistrationStatus({ quality: nq(), similar: [], duplicadoLiteral: false }).status).toBe('regular');
  });
  it('revisar quando só há problema de formatação', () => {
    expect(getFunctionRegistrationStatus({ quality: nq(true), similar: [], duplicadoLiteral: false }).status).toBe('revisar');
  });
  it('possível correspondência quando há similaridade', () => {
    const s = getFunctionRegistrationStatus({
      quality: nq(), duplicadoLiteral: false,
      similar: [{ targetId: 'b', targetNome: 'AUXILIAR DE PRODUÇÃO', targetFuncionarios: 12, type: 'accent_difference', confidence: 'high', diffs: ['Acentuação'] }],
    });
    expect(s.status).toBe('possivel_correspondencia');
    expect(s.motivos.join(' ')).toContain('AUXILIAR DE PRODUÇÃO');
  });
  it('duplicidade literal também é possível correspondência', () => {
    expect(getFunctionRegistrationStatus({ quality: nq(), similar: [], duplicadoLiteral: true }).status).toBe('possivel_correspondencia');
  });
});

// ---------- dependências / utilização ----------
describe('buildFunctionUsageMaps / usageFor', () => {
  const funcs = [funcao({ id: 'f1', nome: 'AUXILIAR DE PRODUÇÃO' }), funcao({ id: 'f2', nome: 'AFIADOR' })];
  const funcionarios = [
    emp({ id: 'e1', funcao_id: 'f1', setor_id: 's1', setor: { nome: 'Pintura' }, empresa_id: 'emp1', categoria_id: 'c1' }),
    emp({ id: 'e2', funcao_id: 'f1', setor_id: 's2', setor: { nome: 'Montagem' }, empresa_id: 'emp1', categoria_id: 'c2' }),
    emp({ id: 'e3', funcao_id: 'f1', setor_id: 's1', setor: { nome: 'Pintura' }, empresa_id: 'emp2', categoria_id: 'c1' }),
    emp({ id: 'e4', funcao_id: 'f2', setor_id: 's1', ativo: false }), // inativo não conta
  ];
  const resultados = [res('AUXILIAR DE PRODUCAO'), res('AUXILIAR DE PRODUCAO')]; // snapshot por nome

  it('agrega em lote sem duplicar (funcionários/setores/empresas/categorias distintos)', () => {
    const maps = buildFunctionUsageMaps(funcionarios, resultados);
    const u1 = usageFor(funcs[0], maps);
    expect(u1.funcionarios).toBe(3);
    expect(u1.setores).toBe(2);
    expect(u1.empresas).toBe(2);
    expect(u1.categorias).toBe(2);
    expect(u1.emUso).toBe(true);
    // histórico casa por nome normalizado (acento ignorado)
    expect(u1.resultadosHistoricos).toBe(2);
    // principais setores ordenados por nº de funcionários
    expect(u1.topSetores[0]).toEqual({ nome: 'Pintura', funcionarios: 2 });
  });
  it('função sem funcionário ativo, mas com histórico → somente_historico', () => {
    const maps = buildFunctionUsageMaps(funcionarios, [res('AFIADOR')]);
    const u2 = usageFor(funcs[1], maps);
    expect(u2.funcionarios).toBe(0);
    expect(u2.emUso).toBe(false);
    expect(u2.somenteHistorico).toBe(true);
  });
  it('hasActiveLinks reflete funcionários ativos', () => {
    const maps = buildFunctionUsageMaps(funcionarios, resultados);
    expect(hasActiveLinks(usageFor(funcs[0], maps))).toBe(true);
    expect(hasActiveLinks(usageFor(funcs[1], maps))).toBe(false);
  });
});

// ---------- validação ----------
describe('isValidFunctionName', () => {
  it('rejeita vazio/espaços e aceita nome real', () => {
    expect(isValidFunctionName('   ')).toBe(false);
    expect(isValidFunctionName('Operador')).toBe(true);
  });
});

// ---------- filtros / abas / resumo ----------
describe('filtros, abas e resumo', () => {
  const mkRow = (over: Partial<FunctionRow> & { id: string; nome: string }): FunctionRow => ({
    descricao: null, nivelHierarquico: null,
    quality: { issues: [], hasIssues: false },
    usage: { funcionarios: 0, setores: 0, empresas: 0, categorias: 0, resultadosHistoricos: 0, emUso: false, somenteHistorico: false, topSetores: [] },
    similar: [], duplicadoLiteral: false, setorIds: [],
    status: { status: 'regular', motivos: [], descricao: '' },
    ...over,
  });
  const emUso = mkRow({
    id: 'a', nome: 'AUXILIAR DE PRODUÇÃO', setorIds: ['s1'],
    usage: { funcionarios: 84, setores: 1, empresas: 1, categorias: 1, resultadosHistoricos: 0, emUso: true, somenteHistorico: false, topSetores: [{ nome: 'Pintura', funcionarios: 84 }] },
  });
  const semVinc = mkRow({ id: 'b', nome: 'AFIADOR', status: { status: 'regular', motivos: [], descricao: '' } });
  const revisar = mkRow({ id: 'c', nome: 'MECANICO ', status: { status: 'revisar', motivos: ['x'], descricao: '' } });
  const corresp = mkRow({ id: 'd', nome: 'MECÂNICO', status: { status: 'possivel_correspondencia', motivos: ['x'], descricao: '' } });
  const rows = [emUso, semVinc, revisar, corresp];

  it('busca por nome e por setor relacionado', () => {
    expect(matchesFunctionFilters(emUso, { ...DEFAULT_FUNCTION_FILTERS, search: 'auxiliar' })).toBe(true);
    expect(matchesFunctionFilters(emUso, { ...DEFAULT_FUNCTION_FILTERS, search: 'pintura' })).toBe(true);
    expect(matchesFunctionFilters(semVinc, { ...DEFAULT_FUNCTION_FILTERS, search: 'pintura' })).toBe(false);
  });
  it('filtro de utilização', () => {
    expect(matchesFunctionFilters(emUso, { ...DEFAULT_FUNCTION_FILTERS, utilizacao: 'em_uso' })).toBe(true);
    expect(matchesFunctionFilters(semVinc, { ...DEFAULT_FUNCTION_FILTERS, utilizacao: 'sem_vinculo' })).toBe(true);
  });
  it('filtro por setor', () => {
    expect(matchesFunctionFilters(emUso, { ...DEFAULT_FUNCTION_FILTERS, setorId: 's1' })).toBe(true);
    expect(matchesFunctionFilters(semVinc, { ...DEFAULT_FUNCTION_FILTERS, setorId: 's1' })).toBe(false);
  });
  it('filtro por situação', () => {
    expect(matchesFunctionFilters(corresp, { ...DEFAULT_FUNCTION_FILTERS, situacao: 'possivel_correspondencia' })).toBe(true);
    expect(matchesFunctionFilters(emUso, { ...DEFAULT_FUNCTION_FILTERS, situacao: 'possivel_correspondencia' })).toBe(false);
  });
  it('aba Revisar inclui revisar e possível correspondência', () => {
    expect(matchesFunctionTab(revisar, 'revisar')).toBe(true);
    expect(matchesFunctionTab(corresp, 'revisar')).toBe(true);
    expect(matchesFunctionTab(emUso, 'revisar')).toBe(false);
  });
  it('contagem de filtros ativos', () => {
    expect(countActiveFunctionFilters({ ...DEFAULT_FUNCTION_FILTERS, setorId: 's1', situacao: 'revisar' })).toBe(2);
  });
  it('resumo e contagem por aba', () => {
    const s = computeFunctionSummary(rows);
    expect(s.total).toBe(4);
    expect(s.emUso).toBe(1);
    expect(s.semVinculo).toBe(3);
    expect(s.aRevisar).toBe(2);
    expect(s.correspondencias).toBe(1);
    expect(functionTabCounts(rows)).toEqual({ todas: 4, em_uso: 1, sem_vinculo: 3, revisar: 2 });
  });
});
