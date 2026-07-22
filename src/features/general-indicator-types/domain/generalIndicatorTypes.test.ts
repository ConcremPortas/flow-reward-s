import { describe, it, expect } from 'vitest';
import { normalizeCodigo, isValidCodigo, isValidNome, normalizeNome } from './generalIndicatorTypeValidation';
import { buildTypeMeasurementUsage, usageForType } from './generalIndicatorTypeCodeUsage';
import { resolveIndicatorDefinition, formatTypeValue } from './generalIndicatorValueFormatting';
import { hasMeasurements, hasActiveLinks } from './generalIndicatorTypeDependencies';
import { getGeneralIndicatorTypeStatus } from './generalIndicatorTypeStatus';
import {
  matchesGeneralIndicatorTypeFilters, computeGeneralIndicatorTypeContext, countActiveGeneralIndicatorTypeFilters,
} from './generalIndicatorTypeFilters';
import { DEFAULT_GENERAL_INDICATOR_TYPE_FILTERS, type GeneralIndicatorTypeRow, type GeneralIndicatorTypeUsage } from '../types/general-indicator-type.types';
import type { IndicadorGeral } from '@/hooks/useIndicadoresGerais';

const reg = (over: Partial<IndicadorGeral> & { id: string; tipo_indicador_id: string }): IndicadorGeral => ({
  competencia: '2026-05-01', meta: 0, realizado: 0, percentual: 0, created_at: '', updated_at: '', ...over,
});

// ---------- validação do código ----------
describe('validação do código', () => {
  it('normaliza maiúsculas e apara', () => {
    expect(normalizeCodigo('  fat ')).toBe('FAT');
  });
  it('FAT (3) e KITS (4) válidos — sem tamanho fixo', () => {
    expect(isValidCodigo('FAT')).toBe(true);
    expect(isValidCodigo('KITS')).toBe(true);
    expect(isValidCodigo('')).toBe(false);
    expect(isValidCodigo('A B')).toBe(false);
  });
  it('nome obrigatório e normalização', () => {
    expect(isValidNome(' ')).toBe(false);
    expect(isValidNome('Faturamento')).toBe(true);
    expect(normalizeNome('  Quantidade  de Kits ')).toBe('quantidade de kits');
  });
});

// ---------- formatação por código (reuso) ----------
// Intl usa espaço não-quebrável (U+00A0); normalizamos para comparar.
const norm = (s: string) => s.replace(/\u00A0/g, ' ');
describe('formatação por código (FAT moeda / KITS número)', () => {
  it('FAT formata como moeda BRL', () => {
    const def = resolveIndicatorDefinition('FAT', 'Faturamento');
    expect(def.format).toBe('currency');
    expect(norm(formatTypeValue(18500000, def))).toBe('R$ 18.500.000,00');
  });
  it('KITS formata como número com unidade', () => {
    const def = resolveIndicatorDefinition('KITS', 'Quantidade de Kits');
    expect(def.format).toBe('integer');
    expect(norm(formatTypeValue(21116, def))).toBe('21.116 kits');
  });
});

// ---------- utilização ----------
describe('buildTypeMeasurementUsage / usageForType', () => {
  const indicadores = [
    reg({ id: 'r1', tipo_indicador_id: 't-fat', competencia: '2026-04-01', meta: 100, realizado: 90, percentual: 90 }),
    reg({ id: 'r2', tipo_indicador_id: 't-fat', competencia: '2026-05-01', meta: 100, realizado: 110, percentual: 110 }),
    reg({ id: 'r3', tipo_indicador_id: 't-kits', competencia: '2026-05-01', meta: 20000, realizado: 21116, percentual: 105 }),
  ];
  it('conta medições, competências e último registro por tipo', () => {
    const stats = buildTypeMeasurementUsage(indicadores);
    const fat = usageForType('t-fat', stats);
    expect(fat.medicoes).toBe(2);
    expect(fat.competencias).toBe(2);
    expect(fat.ultimaCompetencia).toBe('2026-05-01');
    expect(fat.ultimoRealizado).toBe(110);  // registro mais recente
    expect(fat.ultimoPercentual).toBe(110);
  });
  it('tipo sem medições → zeros', () => {
    const stats = buildTypeMeasurementUsage(indicadores);
    const u = usageForType('t-novo', stats);
    expect(u.medicoes).toBe(0);
    expect(u.ultimaCompetencia).toBeNull();
  });
});

// ---------- dependências ----------
describe('dependências de exclusão (hard delete)', () => {
  const usage = (medicoes: number): GeneralIndicatorTypeUsage =>
    ({ medicoes, competencias: 0, ultimaCompetencia: null, ultimoMeta: null, ultimoRealizado: null, ultimoPercentual: null });
  it('bloqueia com medições, libera sem', () => {
    expect(hasMeasurements(usage(5))).toBe(true);
    expect(hasActiveLinks(usage(5))).toBe(true);
    expect(hasActiveLinks(usage(0))).toBe(false);
  });
});

// ---------- situação cadastral ----------
describe('getGeneralIndicatorTypeStatus', () => {
  const u = (medicoes = 0): GeneralIndicatorTypeUsage => ({ medicoes, competencias: 0, ultimaCompetencia: null, ultimoMeta: null, ultimoRealizado: null, ultimoPercentual: null });
  it('regular quando ok e com medições', () => {
    expect(getGeneralIndicatorTypeStatus({ codigoValido: true, nomeInformado: true, usage: u(5), duplicadoCodigo: false }).status).toBe('regular');
  });
  it('sem medições quando ok mas vazio', () => {
    expect(getGeneralIndicatorTypeStatus({ codigoValido: true, nomeInformado: true, usage: u(0), duplicadoCodigo: false }).status).toBe('sem_medicoes');
  });
  it('config incompleta com código inválido', () => {
    expect(getGeneralIndicatorTypeStatus({ codigoValido: false, nomeInformado: true, usage: u(5), duplicadoCodigo: false }).status).toBe('config_incompleta');
  });
  it('revisar com código duplicado', () => {
    expect(getGeneralIndicatorTypeStatus({ codigoValido: true, nomeInformado: true, usage: u(5), duplicadoCodigo: true }).status).toBe('revisar');
  });
});

// ---------- filtros / contexto ----------
describe('filtros e faixa de contexto', () => {
  const mkRow = (over: Partial<GeneralIndicatorTypeRow> & { id: string; codigo: string; nome: string }): GeneralIndicatorTypeRow => ({
    descricao: null, ativo: true, duplicadoCodigo: false, duplicadoNome: false,
    definition: resolveIndicatorDefinition(over.codigo, over.nome),
    usage: { medicoes: 0, competencias: 0, ultimaCompetencia: null, ultimoMeta: null, ultimoRealizado: null, ultimoPercentual: null },
    status: { status: 'regular', motivos: [], descricao: '' }, ...over,
  });
  const fat = mkRow({ id: 't-fat', codigo: 'FAT', nome: 'Faturamento', usage: { medicoes: 8, competencias: 8, ultimaCompetencia: '2026-05-01', ultimoMeta: 100, ultimoRealizado: 110, ultimoPercentual: 110 } });
  const kits = mkRow({ id: 't-kits', codigo: 'KITS', nome: 'Quantidade de Kits', ativo: false, status: { status: 'sem_medicoes', motivos: [], descricao: '' } });
  const rows = [fat, kits];

  it('busca por código e nome', () => {
    expect(matchesGeneralIndicatorTypeFilters(fat, { ...DEFAULT_GENERAL_INDICATOR_TYPE_FILTERS, search: 'fat' })).toBe(true);
    expect(matchesGeneralIndicatorTypeFilters(fat, { ...DEFAULT_GENERAL_INDICATOR_TYPE_FILTERS, search: 'fatur' })).toBe(true);
    expect(matchesGeneralIndicatorTypeFilters(kits, { ...DEFAULT_GENERAL_INDICATOR_TYPE_FILTERS, search: 'fat' })).toBe(false);
  });
  it('filtro por status ativo/inativo e utilização', () => {
    expect(matchesGeneralIndicatorTypeFilters(kits, { ...DEFAULT_GENERAL_INDICATOR_TYPE_FILTERS, status: 'inativo' })).toBe(true);
    expect(matchesGeneralIndicatorTypeFilters(fat, { ...DEFAULT_GENERAL_INDICATOR_TYPE_FILTERS, status: 'inativo' })).toBe(false);
    expect(matchesGeneralIndicatorTypeFilters(fat, { ...DEFAULT_GENERAL_INDICATOR_TYPE_FILTERS, utilizacao: 'com_medicao' })).toBe(true);
    expect(matchesGeneralIndicatorTypeFilters(kits, { ...DEFAULT_GENERAL_INDICATOR_TYPE_FILTERS, utilizacao: 'sem_medicao' })).toBe(true);
    expect(countActiveGeneralIndicatorTypeFilters({ ...DEFAULT_GENERAL_INDICATOR_TYPE_FILTERS, status: 'ativo', utilizacao: 'com_medicao' })).toBe(2);
  });
  it('faixa de contexto', () => {
    expect(computeGeneralIndicatorTypeContext(rows)).toMatchObject({ total: 2, ativos: 1, comMedicoes: 1, totalMedicoes: 8, ultimaCompetencia: '2026-05-01' });
  });
});
