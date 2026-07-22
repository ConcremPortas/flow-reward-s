import { describe, it, expect } from 'vitest';
import { normalizeCodigo, isValidCodigo, isValidNome, normalizeNome, toPersistedNome } from './indicatorTypeValidation';
import { buildMeasurementUsage, usageForCode, CODE_COLUMN_MAP } from './indicatorTypeCodeUsage';
import { hasMeasurements, hasActiveLinks } from './indicatorTypeDependencies';
import { getIndicatorTypeStatus } from './indicatorTypeStatus';
import {
  matchesIndicatorTypeFilters, computeIndicatorTypeSummary, countActiveIndicatorTypeFilters,
} from './indicatorTypeFilters';
import { DEFAULT_INDICATOR_TYPE_FILTERS, type IndicatorTypeRow, type IndicatorTypeMeasurementUsage } from '../types/indicator-type.types';
import type { IndicadorSetor } from '@/hooks/useIndicadoresSetor';

const ind = (over: Partial<IndicadorSetor> & { id: string }): IndicadorSetor => ({
  competencia: '2026-05-01', created_at: '', updated_at: '', ...over,
});

// ---------- validação do código ----------
describe('validação do código', () => {
  it('normaliza para maiúsculas e apara', () => {
    expect(normalizeCodigo('  opc ')).toBe('OPC');
  });
  it('aceita 1 a 3+ caracteres (HM, OPC), rejeita vazio e espaços', () => {
    expect(isValidCodigo('HM')).toBe(true);
    expect(isValidCodigo('OPC')).toBe(true);
    expect(isValidCodigo('L')).toBe(true);
    expect(isValidCodigo('')).toBe(false);
    expect(isValidCodigo('A B')).toBe(false);
  });
  it('nome obrigatório', () => {
    expect(isValidNome('  ')).toBe(false);
    expect(isValidNome('Hora Máquina')).toBe(true);
    expect(toPersistedNome('  Hora Máquina ')).toBe('Hora Máquina');
    expect(normalizeNome('  Hora  Máquina ')).toBe('hora máquina');
  });
});

// ---------- utilização por código↔coluna ----------
describe('buildMeasurementUsage / usageForCode', () => {
  const indicadores = [
    ind({ id: 'i1', setor_id: 's1', competencia: '2026-04-01', hora_maquina_meta: 100, hora_maquina_realizado: 90 }),
    ind({ id: 'i2', setor_id: 's2', competencia: '2026-05-01', hora_maquina_realizado: 80, limpeza_meta: 10 }),
    ind({ id: 'i3', setor_id: 's1', competencia: '2026-05-01', identificacao_nc_meta: 5 }),
  ];

  it('conta medições, setores e competências por coluna (sem N+1)', () => {
    const stats = buildMeasurementUsage(indicadores);
    const hm = usageForCode('HM', stats);
    expect(hm.temCorrespondencia).toBe(true);
    expect(hm.coluna).toBe('hora_maquina');
    expect(hm.medicoes).toBe(2);           // i1, i2
    expect(hm.setores).toBe(2);            // s1, s2
    expect(hm.competencias).toBe(2);       // 2026-04, 2026-05
    expect(hm.ultimaCompetencia).toBe('2026-05-01');
  });
  it('código minúsculo resolve a mesma coluna', () => {
    const stats = buildMeasurementUsage(indicadores);
    expect(usageForCode('hm', stats).medicoes).toBe(2);
  });
  it('código sem medição → zero', () => {
    const stats = buildMeasurementUsage(indicadores);
    expect(usageForCode('NC', stats).medicoes).toBe(0);        // tratamento_nc sem registros
    expect(usageForCode('NC', stats).temCorrespondencia).toBe(true);
  });
  it('código desconhecido → sem correspondência', () => {
    const stats = buildMeasurementUsage(indicadores);
    const u = usageForCode('XYZ', stats);
    expect(u.temCorrespondencia).toBe(false);
    expect(u.medicoes).toBe(0);
  });
  it('mapa cobre os 5 códigos conhecidos', () => {
    expect(Object.keys(CODE_COLUMN_MAP).sort()).toEqual(['HM', 'ID', 'L', 'NC', 'OPC']);
  });
});

// ---------- dependências ----------
describe('dependências de exclusão', () => {
  const usage = (medicoes: number): IndicatorTypeMeasurementUsage =>
    ({ temCorrespondencia: true, coluna: 'hora_maquina', medicoes, setores: 0, competencias: 0, ultimaCompetencia: null });
  it('bloqueia com medições, libera sem', () => {
    expect(hasMeasurements(usage(3))).toBe(true);
    expect(hasActiveLinks(usage(3))).toBe(true);
    expect(hasActiveLinks(usage(0))).toBe(false);
  });
});

// ---------- situação cadastral ----------
describe('getIndicatorTypeStatus', () => {
  const u = (over: Partial<IndicatorTypeMeasurementUsage> = {}): IndicatorTypeMeasurementUsage =>
    ({ temCorrespondencia: true, coluna: 'hora_maquina', medicoes: 0, setores: 0, competencias: 0, ultimaCompetencia: null, ...over });

  it('regular quando ok e com medições', () => {
    expect(getIndicatorTypeStatus({ ativo: true, codigoValido: true, nomeInformado: true, usage: u({ medicoes: 5 }), duplicadoCodigo: false }).status).toBe('regular');
  });
  it('sem utilização quando ok mas sem medição', () => {
    expect(getIndicatorTypeStatus({ ativo: true, codigoValido: true, nomeInformado: true, usage: u({ medicoes: 0 }), duplicadoCodigo: false }).status).toBe('sem_utilizacao');
  });
  it('config incompleta quando código inválido', () => {
    expect(getIndicatorTypeStatus({ ativo: true, codigoValido: false, nomeInformado: true, usage: u(), duplicadoCodigo: false }).status).toBe('config_incompleta');
  });
  it('revisar quando código duplicado ou sem correspondência', () => {
    expect(getIndicatorTypeStatus({ ativo: true, codigoValido: true, nomeInformado: true, usage: u({ medicoes: 5 }), duplicadoCodigo: true }).status).toBe('revisar');
    expect(getIndicatorTypeStatus({ ativo: true, codigoValido: true, nomeInformado: true, usage: u({ temCorrespondencia: false }), duplicadoCodigo: false }).status).toBe('revisar');
  });
});

// ---------- filtros / resumo ----------
describe('filtros e resumo', () => {
  const mkRow = (over: Partial<IndicatorTypeRow> & { id: string; codigo: string; nome: string }): IndicatorTypeRow => ({
    descricao: null, ativo: true, duplicadoCodigo: false, duplicadoNome: false,
    usage: { temCorrespondencia: true, coluna: 'hora_maquina', medicoes: 0, setores: 0, competencias: 0, ultimaCompetencia: null },
    status: { status: 'regular', motivos: [], descricao: '' }, ...over,
  });
  const hm = mkRow({ id: 't1', codigo: 'HM', nome: 'Hora Máquina', usage: { temCorrespondencia: true, coluna: 'hora_maquina', medicoes: 216, setores: 18, competencias: 12, ultimaCompetencia: '2026-05-01' } });
  const sem = mkRow({ id: 't2', codigo: 'L', nome: 'Limpeza', status: { status: 'sem_utilizacao', motivos: [], descricao: '' } });
  const rev = mkRow({ id: 't3', codigo: 'XYZ', nome: 'Estranho', status: { status: 'revisar', motivos: ['x'], descricao: '' } });
  const rows = [hm, sem, rev];

  it('busca por código e nome', () => {
    expect(matchesIndicatorTypeFilters(hm, { ...DEFAULT_INDICATOR_TYPE_FILTERS, search: 'HM' })).toBe(true);
    expect(matchesIndicatorTypeFilters(hm, { ...DEFAULT_INDICATOR_TYPE_FILTERS, search: 'hora' })).toBe(true);
    expect(matchesIndicatorTypeFilters(sem, { ...DEFAULT_INDICATOR_TYPE_FILTERS, search: 'HM' })).toBe(false);
  });
  it('filtro por utilização e situação', () => {
    expect(matchesIndicatorTypeFilters(hm, { ...DEFAULT_INDICATOR_TYPE_FILTERS, utilizacao: 'em_uso' })).toBe(true);
    expect(matchesIndicatorTypeFilters(sem, { ...DEFAULT_INDICATOR_TYPE_FILTERS, utilizacao: 'sem_medicao' })).toBe(true);
    expect(matchesIndicatorTypeFilters(rev, { ...DEFAULT_INDICATOR_TYPE_FILTERS, situacao: 'revisar' })).toBe(true);
    expect(countActiveIndicatorTypeFilters({ ...DEFAULT_INDICATOR_TYPE_FILTERS, utilizacao: 'em_uso', situacao: 'revisar' })).toBe(2);
  });
  it('resumo', () => {
    expect(computeIndicatorTypeSummary(rows)).toMatchObject({ total: 3, emUso: 1, semMedicao: 2, aRevisar: 1 });
  });
});
