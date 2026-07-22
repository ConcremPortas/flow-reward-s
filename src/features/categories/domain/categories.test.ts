import { describe, it, expect } from 'vitest';
import { normalizeForDuplicate, toPersistedName, isValidCategoryName } from './categoryValidation';
import { buildCategoryUsageMaps, usageFor, deriveUtilizacao, isPremiavelPorNome } from './categoryUsage';
import { hasActiveLinks, activeLinkReasons } from './categoryDependencies';
import { matchesCategoryFilters, computeCategorySummary, countActiveCategoryFilters } from './categoryFilters';
import { DEFAULT_CATEGORY_FILTERS, type CategoryRow, type CategoryUsage } from '../types/category.types';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { Faixa } from '@/hooks/useFaixas';
import type { FormulaCalculo } from '@/hooks/useFormulasCalculo';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { Categoria } from '@/hooks/useCategorias';

// ---------- helpers ----------
const cat = (over: Partial<Categoria> & { id: string; nome: string }): Categoria => ({
  ativo: true, created_at: '', updated_at: '', ...over,
});
const emp = (over: Partial<Funcionario> & { id: string }): Funcionario => ({
  nome: 'X', ativo: true, created_at: '', updated_at: '', ...over,
});
const faixa = (over: Partial<Faixa> & { id: string; nome: string; valor: number }): Faixa => ({
  ativo: true, created_at: '', updated_at: '', ...over,
});
const formula = (over: Partial<FormulaCalculo> & { id: string; nome: string }): FormulaCalculo => ({
  ativo: true, created_at: '', updated_at: '',
  peso_producao_setor: null, peso_epi: null, peso_faltas: null, peso_advertencias: null, peso_dss: null,
  peso_faturamento: null, peso_itens_nc: null, peso_tratamento_nc: null, peso_hora_maquina: null,
  peso_operacao_segura: null, peso_limpeza: null, multiplicador_kits: null, ...over,
});
const res = (categoriaNome: string): ResultadoPremiacao => ({
  id: Math.random().toString(36), mes_competencia: '2026-05-01', nome: 'x', categoria: categoriaNome,
  nota_epi: 1, nota_faltas: 1, nota_advertencias: 1, nota_dss: 1, nota_geral: 1,
  bonus_possivel: 0, bonus_alcancado: 0, created_at: '', updated_at: '',
} as ResultadoPremiacao);

// ---------- validação / duplicidade ----------
describe('validação e duplicidade', () => {
  it('nome vazio / só espaços é inválido', () => {
    expect(isValidCategoryName('')).toBe(false);
    expect(isValidCategoryName('   ')).toBe(false);
    expect(isValidCategoryName('AUXILIAR')).toBe(true);
  });
  it('persiste aparando extremidades, sem mudar caixa/acento', () => {
    expect(toPersistedName('  Auxiliar ')).toBe('Auxiliar');
  });
  it('duplicidade: exatamente igual, por caixa e por espaços', () => {
    const base = normalizeForDuplicate('AUXILIAR');
    expect(normalizeForDuplicate('AUXILIAR')).toBe(base);       // exata
    expect(normalizeForDuplicate('auxiliar')).toBe(base);        // caixa
    expect(normalizeForDuplicate('  AUXILIAR ')).toBe(base);     // espaços
    expect(normalizeForDuplicate('AUXI  LIAR')).toBe('auxi liar');
  });
  it('NÃO trata semanticamente próximos como duplicados', () => {
    expect(normalizeForDuplicate('GERENTE')).not.toBe(normalizeForDuplicate('SUBGERENTE'));
  });
  it('isPremiavelPorNome usa a lista textual (case-insensitive)', () => {
    expect(isPremiavelPorNome('auxiliar')).toBe(true);
    expect(isPremiavelPorNome('SUPERVISOR')).toBe(true);
    expect(isPremiavelPorNome('GERENTE')).toBe(false);
  });
});

// ---------- utilização / vínculos ----------
describe('buildCategoryUsageMaps / usageFor', () => {
  const categorias = [cat({ id: 'c-aux', nome: 'AUXILIAR' }), cat({ id: 'c-ger', nome: 'GERENTE' })];
  const funcionarios = [
    emp({ id: 'e1', categoria_id: 'c-aux', base_premiacao: { nome: 'Base A' }, setor: { nome: 'Pintura' } }),
    emp({ id: 'e2', categoria_id: 'c-aux', base_premiacao: { nome: 'Base A' }, setor: { nome: 'Montagem' } }),
    emp({ id: 'e3', categoria_id: 'c-aux', base_premiacao: { nome: 'Base B' }, setor: { nome: 'Pintura' } }),
    emp({ id: 'e4', categoria_id: 'c-aux', ativo: false }), // inativo não conta
  ];
  const faixas = [faixa({ id: 'fx1', nome: 'Faixa 1', valor: 150, categoria_id: 'c-aux' }), faixa({ id: 'fx2', nome: 'Faixa 2', valor: 0, categoria_id: 'c-aux' })];
  const formulas = [formula({ id: 'fm1', nome: 'Fórmula Aux', categoria_id: 'c-aux' })];
  const resultados = [res('AUXILIAR'), res('auxiliar'), res('AUXILIAR')]; // snapshot por nome (case-insensitive)

  it('agrega funcionários únicos, faixas, fórmulas e bases/setores indiretos (sem N+1)', () => {
    const maps = buildCategoryUsageMaps(funcionarios, faixas, formulas, resultados);
    const u = usageFor(categorias[0], maps);
    expect(u.funcionarios).toBe(3);            // e4 inativo não conta
    expect(u.faixas).toBe(2);
    expect(u.formulas).toBe(1);
    expect(u.basesIndiretas).toBe(2);          // Base A, Base B
    expect(u.setoresIndiretos).toBe(2);        // Pintura, Montagem
    expect(u.resultadosHistoricos).toBe(3);    // casa por nome normalizado
    expect(u.emUso).toBe(true);
    expect(u.usadaEmPremiacao).toBe(true);     // premiável + faixas/fórmulas
    expect(u.faixasRef.map(f => f.nome)).toEqual(['Faixa 1', 'Faixa 2']);
    expect(u.topBases[0].nome).toBe('Base A');  // 2 funcionários
  });

  it('categoria sem funcionários e sem histórico → sem vínculo', () => {
    const maps = buildCategoryUsageMaps(funcionarios, faixas, formulas, resultados);
    const u = usageFor(categorias[1], maps);
    expect(u.funcionarios).toBe(0);
    expect(u.emUso).toBe(false);
    expect(u.somenteHistorico).toBe(false);
    expect(deriveUtilizacao(u)).toBe('sem_vinculo');
    expect(u.usadaEmPremiacao).toBe(false);
  });

  it('categoria sem funcionários atuais mas com histórico → uso histórico', () => {
    const maps = buildCategoryUsageMaps([], [], [], [res('GERENTE')]);
    const u = usageFor(categorias[1], maps);
    expect(u.somenteHistorico).toBe(true);
    expect(deriveUtilizacao(u)).toBe('uso_historico');
  });
});

// ---------- dependências de exclusão ----------
describe('dependências de exclusão', () => {
  const mkUsage = (over: Partial<CategoryUsage>): CategoryUsage => ({
    funcionarios: 0, faixas: 0, formulas: 0, basesIndiretas: 0, setoresIndiretos: 0, resultadosHistoricos: 0,
    emUso: false, somenteHistorico: false, premiavelPorNome: false, usadaEmPremiacao: false,
    faixasRef: [], formulasNomes: [], topBases: [], topSetores: [], ...over,
  });
  it('bloqueia com funcionários, faixas ou fórmulas ativas', () => {
    expect(hasActiveLinks(mkUsage({ funcionarios: 5 }))).toBe(true);
    expect(hasActiveLinks(mkUsage({ faixas: 1 }))).toBe(true);
    expect(hasActiveLinks(mkUsage({ formulas: 1 }))).toBe(true);
  });
  it('histórico sozinho NÃO bloqueia', () => {
    expect(hasActiveLinks(mkUsage({ resultadosHistoricos: 918 }))).toBe(false);
  });
  it('lista os motivos de bloqueio', () => {
    expect(activeLinkReasons(mkUsage({ funcionarios: 1, faixas: 2 }))).toEqual(['funcionarios', 'faixas']);
  });
});

// ---------- filtros / resumo ----------
describe('filtros e resumo', () => {
  const mkRow = (over: Partial<CategoryRow> & { id: string; nome: string }): CategoryRow => ({
    descricao: null, duplicado: false, utilizacao: 'sem_vinculo',
    usage: {
      funcionarios: 0, faixas: 0, formulas: 0, basesIndiretas: 0, setoresIndiretos: 0, resultadosHistoricos: 0,
      emUso: false, somenteHistorico: false, premiavelPorNome: false, usadaEmPremiacao: false,
      faixasRef: [], formulasNomes: [], topBases: [], topSetores: [],
    },
    ...over,
  });
  const aux = mkRow({ id: 'c-aux', nome: 'AUXILIAR', utilizacao: 'em_uso',
    usage: { ...mkRow({ id: 'x', nome: 'x' }).usage, funcionarios: 241, emUso: true, usadaEmPremiacao: true, topBases: [{ nome: 'Base A', funcionarios: 241 }] } });
  const ger = mkRow({ id: 'c-ger', nome: 'GERENTE' });
  const rows = [aux, ger];

  it('busca por nome e por base relacionada', () => {
    expect(matchesCategoryFilters(aux, { ...DEFAULT_CATEGORY_FILTERS, search: 'auxiliar' })).toBe(true);
    expect(matchesCategoryFilters(aux, { ...DEFAULT_CATEGORY_FILTERS, search: 'base a' })).toBe(true);
    expect(matchesCategoryFilters(ger, { ...DEFAULT_CATEGORY_FILTERS, search: 'auxiliar' })).toBe(false);
  });
  it('filtro de utilização', () => {
    expect(matchesCategoryFilters(aux, { ...DEFAULT_CATEGORY_FILTERS, utilizacao: 'em_uso' })).toBe(true);
    expect(matchesCategoryFilters(ger, { ...DEFAULT_CATEGORY_FILTERS, utilizacao: 'sem_funcionarios' })).toBe(true);
    expect(matchesCategoryFilters(aux, { ...DEFAULT_CATEGORY_FILTERS, utilizacao: 'em_premiacao' })).toBe(true);
    expect(matchesCategoryFilters(ger, { ...DEFAULT_CATEGORY_FILTERS, utilizacao: 'em_premiacao' })).toBe(false);
  });
  it('conta filtros ativos e resumo', () => {
    expect(countActiveCategoryFilters({ ...DEFAULT_CATEGORY_FILTERS, utilizacao: 'em_uso' })).toBe(1);
    const s = computeCategorySummary(rows);
    expect(s.total).toBe(2);
    expect(s.funcionariosVinculados).toBe(241);
    expect(s.semFuncionarios).toBe(1);
    expect(s.emPremiacao).toBe(1);
  });
});
