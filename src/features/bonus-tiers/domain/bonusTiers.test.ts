import { describe, it, expect } from 'vitest';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { Faixa } from '@/hooks/useFaixas';
import { parseCurrencyBR, isValidTierValue } from './bonusTierValidation';
import { analyzeName, parseMoneyFromName } from './bonusTierNameAnalysis';
import { buildUsageMaps, usageFor, hasActiveLinks } from './bonusTierDependencies';
import { getTierRegistrationStatus } from './bonusTierRegistrationStatus';
import { matchesTierFilters, matchesTierTab, computeTierSummary } from './bonusTierFilters';
import { DEFAULT_TIER_FILTERS, type BonusTierRow } from '../types/bonus-tier.types';

describe('entrada monetária pt-BR', () => {
  it('parseCurrencyBR aceita 150 / 150,00 / 1.250,50 / 150.00', () => {
    expect(parseCurrencyBR('150')).toBe(150);
    expect(parseCurrencyBR('150,00')).toBe(150);
    expect(parseCurrencyBR('1.250,50')).toBe(1250.5);
    expect(parseCurrencyBR('150.00')).toBe(150);
    expect(parseCurrencyBR('R$ 1.250,50')).toBe(1250.5);
    expect(parseCurrencyBR('')).toBeNull();
    expect(parseCurrencyBR('abc')).toBeNull();
  });
  it('zero é valor válido', () => {
    expect(isValidTierValue(0)).toBe(true);
    expect(isValidTierValue(-1)).toBe(false);
    expect(isValidTierValue(null)).toBe(false);
  });
});

describe('análise do nome (observacional)', () => {
  it('sem valor no nome', () => expect(analyzeName('Faixa A', 150).state).toBe('sem_valor'));
  it('valor no nome consistente com o campo', () => {
    const a = analyzeName('AUXILIAR DE PRODUÇÃO B - R$150,00', 150);
    expect(a.state).toBe('consistente');
    expect(a.valorNoNome).toBe(150);
  });
  it('valor no nome divergente do campo', () => {
    const a = analyzeName('AUXILIAR DE PRODUÇÃO B - R$150,00', 200);
    expect(a.state).toBe('divergente');
    expect(a.valorNoNome).toBe(150);
  });
  it('valor não interpretável (R$ sem número válido)', () => {
    expect(analyzeName('Faixa R$', 100).state).toBe('nao_interpretavel');
  });
  it('parseMoneyFromName pega a última ocorrência com milhar', () => {
    expect(parseMoneyFromName('Faixa R$ 1.250,50')).toBe(1250.5);
  });
});

describe('vínculos em lote (sem N+1)', () => {
  const mkFunc = (over: Partial<Funcionario>): Funcionario => ({ id: over.id || 'f', nome: 'x', ativo: true, created_at: '', updated_at: '', ...over });
  const faixa = (id: string, nome: string, valor = 150): Faixa => ({ id, nome, valor, ativo: true, created_at: '', updated_at: '' });
  const funcs = [
    mkFunc({ id: 'f1', faixa_id: 't1', categoria_id: 'c1', base_premiacao_id: 'b1' }),
    mkFunc({ id: 'f2', faixa_id: 't1', categoria_id: 'c2', base_premiacao_id: 'b1' }),
    mkFunc({ id: 'f3', faixa_id: 't1', ativo: false }),
    mkFunc({ id: 'f4', faixa_id: 't2', categoria_id: 'c1' }),
  ];
  const resultados = [{ faixa: 'Faixa A' }, { faixa: 'faixa a' }, { faixa: 'Outra' }] as ResultadoPremiacao[];
  const maps = buildUsageMaps(funcs, resultados);

  it('conta funcionários ativos, categorias e bases distintas', () => {
    const u = usageFor(faixa('t1', 'Faixa A'), maps);
    expect(u.funcionarios).toBe(2);   // f3 inativo fora
    expect(u.categorias).toBe(2);
    expect(u.bases).toBe(1);
    expect(u.emUso).toBe(true);
    expect(u.resultadosHistoricos).toBe(2); // "Faixa A" + "faixa a" (normalizado)
  });
  it('faixa sem funcionários não está em uso', () => {
    const u = usageFor(faixa('t9', 'Vazia'), maps);
    expect(u.emUso).toBe(false);
    expect(hasActiveLinks(u)).toBe(false);
  });
});

describe('situação cadastral', () => {
  const usage = { funcionarios: 3, categorias: 1, bases: 1, resultadosHistoricos: 0, emUso: true };
  it('regular quando em uso e nome ok', () => {
    expect(getTierRegistrationStatus({ usage, nameAnalysis: analyzeName('Faixa A', 150), duplicado: false }).status).toBe('regular');
  });
  it('revisar quando nome diverge do valor', () => {
    expect(getTierRegistrationStatus({ usage, nameAnalysis: analyzeName('Faixa R$150,00', 200), duplicado: false }).status).toBe('revisar');
  });
  it('revisar quando duplicado', () => {
    expect(getTierRegistrationStatus({ usage, nameAnalysis: analyzeName('Faixa A', 150), duplicado: true }).status).toBe('revisar');
  });
  it('sem_vinculo quando sem funcionários; valor zero NÃO é revisar', () => {
    const u = { funcionarios: 0, categorias: 0, bases: 0, resultadosHistoricos: 0, emUso: false };
    expect(getTierRegistrationStatus({ usage: u, nameAnalysis: analyzeName('Faixa Zero', 0), duplicado: false }).status).toBe('sem_vinculo');
  });
});

describe('filtros e abas', () => {
  const row = (over: Partial<BonusTierRow>): BonusTierRow => ({
    id: 't1', nome: 'Faixa A', valor: 150, categoriaId: null,
    nameAnalysis: analyzeName(over.nome ?? 'Faixa A', over.valor ?? 150),
    usage: over.usage ?? { funcionarios: 3, categorias: 1, bases: 1, resultadosHistoricos: 0, emUso: true },
    status: { status: 'regular', motivos: [], descricao: '' }, ...over,
  });
  const rows = [
    row({ id: 't1', nome: 'Faixa A', valor: 150 }),
    row({ id: 't2', nome: 'Faixa B', valor: 0, usage: { funcionarios: 0, categorias: 0, bases: 0, resultadosHistoricos: 0, emUso: false }, status: { status: 'sem_vinculo', motivos: [], descricao: '' } }),
    row({ id: 't3', nome: 'Faixa C - R$100,00', valor: 200, nameAnalysis: analyzeName('Faixa C - R$100,00', 200), status: { status: 'revisar', motivos: ['x'], descricao: '' } }),
  ];
  it('busca por nome e valor', () => {
    expect(matchesTierFilters(rows[0], { ...DEFAULT_TIER_FILTERS, search: '150' })).toBe(true);
    expect(matchesTierFilters(rows[0], { ...DEFAULT_TIER_FILTERS, search: 'faixa b' })).toBe(false);
  });
  it('filtro valor zero e divergência', () => {
    expect(matchesTierFilters(rows[1], { ...DEFAULT_TIER_FILTERS, valorZero: true })).toBe(true);
    expect(matchesTierFilters(rows[0], { ...DEFAULT_TIER_FILTERS, valorZero: true })).toBe(false);
    expect(matchesTierFilters(rows[2], { ...DEFAULT_TIER_FILTERS, comDivergencia: true })).toBe(true);
  });
  it('abas em uso / sem vínculo / revisar', () => {
    expect(matchesTierTab(rows[0], 'em_uso')).toBe(true);
    expect(matchesTierTab(rows[1], 'sem_vinculo')).toBe(true);
    expect(matchesTierTab(rows[2], 'revisar')).toBe(true);
  });
  it('resumo agrega métricas reais', () => {
    const s = computeTierSummary(rows);
    expect(s.total).toBe(3);
    expect(s.emUso).toBe(2);
    expect(s.semVinculo).toBe(1);
    expect(s.valorZero).toBe(1);
    expect(s.aRevisar).toBe(1);
  });
});
