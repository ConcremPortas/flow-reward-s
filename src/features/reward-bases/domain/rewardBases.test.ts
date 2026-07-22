import { describe, it, expect } from 'vitest';
import { formatParameter, parseNumberBR } from './rewardBaseFormatting';
import { deriveEngineBehavior } from './rewardBaseDefinitions';
import { parsePercentFromName, analyzeName } from './rewardBaseNameAnalysis';
import { normalizeForDuplicate, isValidBaseName, isValidBaseParameter, toPersistedName } from './rewardBaseValidation';
import { buildRewardBaseUsageMaps, usageFor, hasActiveLinks } from './rewardBaseDependencies';
import { getRewardBaseStatus } from './rewardBaseStatus';
import {
  matchesRewardBaseFilters, matchesRewardBaseTab, countActiveRewardBaseFilters,
  computeRewardBaseSummary, rewardBaseTabCounts,
} from './rewardBaseFilters';
import { DEFAULT_REWARD_BASE_FILTERS, type RewardBaseRow, type RewardBaseUsage } from '../types/reward-base.types';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { FormulaCalculo } from '@/hooks/useFormulasCalculo';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { BasePremiacao } from '@/hooks/useBasePremiacao';

// ---------- helpers ----------
const base = (over: Partial<BasePremiacao> & { id: string; nome: string }): BasePremiacao => ({
  valor_base: 100, tipo: 'percentual', ativo: true, created_at: '', updated_at: '', ...over,
});
const emp = (over: Partial<Funcionario> & { id: string }): Funcionario => ({
  nome: 'X', ativo: true, created_at: '', updated_at: '', ...over,
});
const formula = (over: Partial<FormulaCalculo> & { id: string; nome: string }): FormulaCalculo => ({
  ativo: true, created_at: '', updated_at: '',
  peso_producao_setor: null, peso_epi: null, peso_faltas: null, peso_advertencias: null, peso_dss: null,
  peso_faturamento: null, peso_itens_nc: null, peso_tratamento_nc: null, peso_hora_maquina: null,
  peso_operacao_segura: null, peso_limpeza: null, multiplicador_kits: null, ...over,
});
const res = (baseId: string): ResultadoPremiacao => ({
  id: Math.random().toString(36), mes_competencia: '2026-05-01', nome: 'x', base_premiacao_id: baseId,
  nota_epi: 1, nota_faltas: 1, nota_advertencias: 1, nota_dss: 1, nota_geral: 1,
  bonus_possivel: 0, bonus_alcancado: 0, created_at: '', updated_at: '',
} as ResultadoPremiacao);

// ---------- formatação / parsing ----------
describe('formatação e parsing', () => {
  it('percentual inteiro e decimal', () => {
    expect(formatParameter('percentual', 100)).toBe('100%');
    expect(formatParameter('percentual', 25)).toBe('25%');
    expect(formatParameter('percentual', 12.5)).toBe('12,5%');
    expect(formatParameter('percentual', 200)).toBe('200%');
    expect(formatParameter('percentual', 0)).toBe('0%');
  });
  it('valor monetário em BRL', () => {
    expect(formatParameter('valor_fixo', 1500)).toBe('R$ 1.500,00');
  });
  it('parseNumberBR aceita pt-BR e ponto', () => {
    expect(parseNumberBR('1.250,50')).toBe(1250.5);
    expect(parseNumberBR('100')).toBe(100);
    expect(parseNumberBR('25,0')).toBe(25);
    expect(parseNumberBR('R$ 1.500,00')).toBe(1500);
    expect(parseNumberBR('200%')).toBe(200);
    expect(parseNumberBR('abc')).toBeNull();
  });
});

// ---------- comportamento no motor (nome) ----------
describe('deriveEngineBehavior (via motor, por nome)', () => {
  it('KIT com % → multiplicador extraído do nome', () => {
    expect(deriveEngineBehavior('KIT 25%')).toMatchObject({ behavior: 'kits', multiplicador: 0.25 });
    expect(deriveEngineBehavior('KIT 100%')).toMatchObject({ behavior: 'kits', multiplicador: 1 });
    expect(deriveEngineBehavior('KIT 200%')).toMatchObject({ behavior: 'kits', multiplicador: 2 });
  });
  it('KITS sem % → multiplicador 1', () => {
    expect(deriveEngineBehavior('KITS')).toMatchObject({ behavior: 'kits', multiplicador: 1 });
  });
  it('PRODUÇÃO → produção', () => {
    expect(deriveEngineBehavior('PRODUÇÃO').behavior).toBe('producao');
  });
  it('outros nomes → outra', () => {
    expect(deriveEngineBehavior('BONIFICAÇÃO').behavior).toBe('outra');
  });
});

// ---------- análise nome × valor ----------
describe('analyzeName', () => {
  it('sem percentual no nome', () => {
    expect(analyzeName('PRODUÇÃO', 'percentual', 100).state).toBe('sem_percentual');
  });
  it('nome e valor iguais', () => {
    expect(analyzeName('KIT 100%', 'percentual', 100).state).toBe('igual');
  });
  it('nome e valor diferentes (KIT 25% com valor_base 100)', () => {
    const a = analyzeName('KIT 25%', 'percentual', 100);
    expect(a.state).toBe('diferente');
    expect(a.percentualNoNome).toBe(25);
  });
  it('parsePercentFromName decimal', () => {
    expect(parsePercentFromName('KIT 12,5%')).toBe(12.5);
    expect(parsePercentFromName('KITS')).toBeNull();
  });
});

// ---------- validação / duplicidade ----------
describe('validação e duplicidade', () => {
  it('nome obrigatório', () => {
    expect(isValidBaseName('   ')).toBe(false);
    expect(isValidBaseName('KIT 100%')).toBe(true);
    expect(toPersistedName('  KIT 100% ')).toBe('KIT 100%');
  });
  it('parâmetro: zero válido, acima de 100% válido, negativo inválido', () => {
    expect(isValidBaseParameter(0, 'percentual')).toBe(true);
    expect(isValidBaseParameter(200, 'percentual')).toBe(true);
    expect(isValidBaseParameter(-1, 'percentual')).toBe(false);
    expect(isValidBaseParameter(null, 'percentual')).toBe(false);
  });
  it('duplicidade por caixa e espaços', () => {
    expect(normalizeForDuplicate('KIT 100%')).toBe(normalizeForDuplicate(' kit 100% '));
  });
});

// ---------- vínculos ----------
describe('buildRewardBaseUsageMaps / usageFor', () => {
  const bases = [base({ id: 'b-kit', nome: 'KIT 100%' }), base({ id: 'b-prod', nome: 'PRODUÇÃO' }), base({ id: 'b-old', nome: 'ANTIGA' })];
  const funcionarios = [
    emp({ id: 'e1', base_premiacao_id: 'b-kit', categoria_id: 'c1', categoria: { nome: 'AUXILIAR' } }),
    emp({ id: 'e2', base_premiacao_id: 'b-kit', categoria_id: 'c1', categoria: { nome: 'AUXILIAR' } }),
    emp({ id: 'e3', base_premiacao_id: 'b-kit', categoria_id: 'c2', categoria: { nome: 'SUPERVISOR' } }),
    emp({ id: 'e4', base_premiacao_id: 'b-kit', ativo: false }), // inativo ignorado
  ];
  const formulas = [formula({ id: 'fm1', nome: 'AUXILIAR - KIT', base_premiacao_id: 'b-kit', categoria_id: 'c3' })];
  const resultados = [res('b-old'), res('b-old'), res('b-kit')];

  it('agrega funcionários únicos, fórmulas, categorias (com fórmula) e histórico — sem N+1', () => {
    const maps = buildRewardBaseUsageMaps(funcionarios, formulas, resultados);
    const u = usageFor(bases[0], maps);
    expect(u.funcionarios).toBe(3);
    expect(u.formulas).toBe(1);
    expect(u.categorias).toBe(3);          // c1, c2 (func.) + c3 (fórmula)
    expect(u.resultadosHistoricos).toBe(1);
    expect(u.emUso).toBe(true);
    expect(u.topCategorias[0]).toEqual({ nome: 'AUXILIAR', funcionarios: 2 });
  });

  it('base sem vínculo atual mas com histórico → somente_historico', () => {
    const maps = buildRewardBaseUsageMaps(funcionarios, formulas, resultados);
    const u = usageFor(bases[2], maps); // b-old: só resultados
    expect(u.emUso).toBe(false);
    expect(u.somenteHistorico).toBe(true);
    expect(hasActiveLinks(u)).toBe(false);
  });

  it('hasActiveLinks bloqueia com funcionários ou fórmulas', () => {
    const maps = buildRewardBaseUsageMaps(funcionarios, formulas, resultados);
    expect(hasActiveLinks(usageFor(bases[0], maps))).toBe(true);
  });
});

// ---------- situação cadastral ----------
describe('getRewardBaseStatus', () => {
  const emptyUsage: RewardBaseUsage = {
    funcionarios: 0, formulas: 0, categorias: 0, resultadosHistoricos: 0, emUso: false, somenteHistorico: false, topCategorias: [], formulasNomes: [],
  };
  const na = (state: 'igual' | 'diferente' | 'sem_percentual' | 'nao_interpretavel', pct: number | null = null) =>
    ({ state, percentualNoNome: pct, temPercentualNoNome: pct != null } as const);

  it('config incompleta quando parâmetro inválido', () => {
    expect(getRewardBaseStatus({ tipo: 'percentual', valorBase: null, nameAnalysis: na('sem_percentual'), usage: emptyUsage, duplicado: false }).status).toBe('config_incompleta');
  });
  it('revisar quando nome diverge do valor (KIT 25% vs 100)', () => {
    const s = getRewardBaseStatus({ tipo: 'percentual', valorBase: 100, nameAnalysis: na('diferente', 25), usage: { ...emptyUsage, funcionarios: 2, emUso: true }, duplicado: false });
    expect(s.status).toBe('revisar');
    expect(s.motivos.join(' ')).toContain('pode ser intencional');
  });
  it('sem vínculo quando ok mas sem uso', () => {
    expect(getRewardBaseStatus({ tipo: 'percentual', valorBase: 100, nameAnalysis: na('igual', 100), usage: emptyUsage, duplicado: false }).status).toBe('sem_vinculo');
  });
  it('regular quando ok e em uso', () => {
    expect(getRewardBaseStatus({ tipo: 'percentual', valorBase: 100, nameAnalysis: na('igual', 100), usage: { ...emptyUsage, funcionarios: 3, emUso: true }, duplicado: false }).status).toBe('regular');
  });
});

// ---------- filtros / abas / resumo ----------
describe('filtros, abas e resumo', () => {
  const mkRow = (over: Partial<RewardBaseRow> & { id: string; nome: string }): RewardBaseRow => ({
    descricao: null, tipo: 'percentual', valorBase: 100,
    nameAnalysis: { state: 'igual', percentualNoNome: 100, temPercentualNoNome: true },
    engine: { behavior: 'kits', multiplicador: 1, label: 'Kits' },
    usage: { funcionarios: 0, formulas: 0, categorias: 0, resultadosHistoricos: 0, emUso: false, somenteHistorico: false, topCategorias: [], formulasNomes: [] },
    status: { status: 'regular', motivos: [], descricao: '' },
    duplicado: false, ...over,
  });
  const emUso = mkRow({ id: 'b-kit', nome: 'KIT 100%', usage: { funcionarios: 27, formulas: 1, categorias: 2, resultadosHistoricos: 8, emUso: true, somenteHistorico: false, topCategorias: [{ nome: 'AUXILIAR', funcionarios: 27 }], formulasNomes: ['AUXILIAR - KIT'] } });
  const semVinc = mkRow({ id: 'b-x', nome: 'BONUS', status: { status: 'sem_vinculo', motivos: [], descricao: '' } });
  const revisar = mkRow({ id: 'b-25', nome: 'KIT 25%', status: { status: 'revisar', motivos: ['x'], descricao: '' }, nameAnalysis: { state: 'diferente', percentualNoNome: 25, temPercentualNoNome: true } });
  const incompleta = mkRow({ id: 'b-bad', nome: 'ANTIGA', tipo: 'valor_fixo', status: { status: 'config_incompleta', motivos: ['x'], descricao: '' } });
  const rows = [emUso, semVinc, revisar, incompleta];

  it('busca por nome/tipo/categoria', () => {
    expect(matchesRewardBaseFilters(emUso, { ...DEFAULT_REWARD_BASE_FILTERS, search: 'kit 100' })).toBe(true);
    expect(matchesRewardBaseFilters(emUso, { ...DEFAULT_REWARD_BASE_FILTERS, search: 'auxiliar' })).toBe(true);
  });
  it('filtro por tipo', () => {
    expect(matchesRewardBaseFilters(incompleta, { ...DEFAULT_REWARD_BASE_FILTERS, tipo: 'valor_fixo' })).toBe(true);
    expect(matchesRewardBaseFilters(emUso, { ...DEFAULT_REWARD_BASE_FILTERS, tipo: 'valor_fixo' })).toBe(false);
  });
  it('filtro por utilização e situação', () => {
    expect(matchesRewardBaseFilters(emUso, { ...DEFAULT_REWARD_BASE_FILTERS, utilizacao: 'em_uso' })).toBe(true);
    expect(matchesRewardBaseFilters(revisar, { ...DEFAULT_REWARD_BASE_FILTERS, situacao: 'revisar' })).toBe(true);
  });
  it('aba Revisar inclui revisar e config incompleta', () => {
    expect(matchesRewardBaseTab(revisar, 'revisar')).toBe(true);
    expect(matchesRewardBaseTab(incompleta, 'revisar')).toBe(true);
    expect(matchesRewardBaseTab(emUso, 'revisar')).toBe(false);
  });
  it('conta filtros ativos e resumo/abas', () => {
    expect(countActiveRewardBaseFilters({ ...DEFAULT_REWARD_BASE_FILTERS, tipo: 'percentual', situacao: 'revisar' })).toBe(2);
    const s = computeRewardBaseSummary(rows);
    expect(s).toMatchObject({ total: 4, emUso: 1, semVinculo: 3, aRevisar: 2, configIncompleta: 1 });
    expect(rewardBaseTabCounts(rows)).toEqual({ todas: 4, em_uso: 1, sem_vinculo: 3, revisar: 2 });
  });
});
