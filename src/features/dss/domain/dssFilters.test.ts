import { describe, it, expect } from 'vitest';
import { matchesAttendanceSearch, matchesAttendanceFilters, matchesHistoryRow } from './dssFilters';
import { DEFAULT_ATTENDANCE_FILTERS, DEFAULT_HISTORY_FILTERS, type DssHistoryRow } from '../types';
import type { Funcionario } from '@/hooks/useFuncionarios';

const mkFuncionario = (over: Partial<Funcionario> = {}): Funcionario => ({
  id: 'f1', nome: 'João Silva', cpf: '0001', ativo: true, setor_id: 's1',
  created_at: '', updated_at: '', ...over,
} as Funcionario);

describe('matchesAttendanceSearch', () => {
  const f = mkFuncionario();
  it('busca vazia sempre casa', () => expect(matchesAttendanceSearch(f, '')).toBe(true));
  it('busca por nome (case-insensitive)', () => expect(matchesAttendanceSearch(f, 'joão')).toBe(true));
  it('busca por código', () => expect(matchesAttendanceSearch(f, '0001')).toBe(true));
  it('sem correspondência não casa', () => expect(matchesAttendanceSearch(f, 'zzz')).toBe(false));
});

describe('matchesAttendanceFilters', () => {
  const f = mkFuncionario();
  it('filtro "presentes" exige presença marcada', () => {
    expect(matchesAttendanceFilters(f, { ...DEFAULT_ATTENDANCE_FILTERS, presenca: 'presentes' }, { f1: true })).toBe(true);
    expect(matchesAttendanceFilters(f, { ...DEFAULT_ATTENDANCE_FILTERS, presenca: 'presentes' }, { f1: false })).toBe(false);
  });
  it('filtro "ausentes" exige presença não marcada', () => {
    expect(matchesAttendanceFilters(f, { ...DEFAULT_ATTENDANCE_FILTERS, presenca: 'ausentes' }, {})).toBe(true);
  });
  it('filtro por setor', () => {
    expect(matchesAttendanceFilters(f, { ...DEFAULT_ATTENDANCE_FILTERS, setorId: 's2' }, {})).toBe(false);
  });
});

describe('matchesHistoryRow', () => {
  const row: DssHistoryRow = { id: '1', titulo: 'EPI', data_realizacao: '2026-05-10', localNome: 'Fábrica 01', localId: 'l1', presentes: 8, totalVinculado: 10, participacao: 80 };

  it('filtra por competência inicial/final', () => {
    expect(matchesHistoryRow(row, { ...DEFAULT_HISTORY_FILTERS, competenciaInicial: '2026-06' })).toBe(false);
    expect(matchesHistoryRow(row, { ...DEFAULT_HISTORY_FILTERS, competenciaInicial: '2026-01', competenciaFinal: '2026-12' })).toBe(true);
  });
  it('filtra por participação baixa/alta', () => {
    expect(matchesHistoryRow(row, { ...DEFAULT_HISTORY_FILTERS, participacao: 'alta' })).toBe(false); // 80 < 90
    expect(matchesHistoryRow(row, { ...DEFAULT_HISTORY_FILTERS, participacao: 'baixa' })).toBe(false); // 80 >= 70
  });
  it('linha sem participacao calculável não casa filtro de participação', () => {
    const semParticipacao = { ...row, totalVinculado: null, participacao: null };
    expect(matchesHistoryRow(semParticipacao, { ...DEFAULT_HISTORY_FILTERS, participacao: 'baixa' })).toBe(false);
  });
});
