import { describe, it, expect } from 'vitest';
import { matchesOccurrenceSearch, matchesOccurrenceFilters } from './occurrenceFilters';
import { DEFAULT_OCCURRENCE_FILTERS } from '../types';
import type { Funcionario } from '@/hooks/useFuncionarios';

const mkFuncionario = (over: Partial<Funcionario> = {}): Funcionario => ({
  id: 'f1', nome: 'João Silva', cpf: '0001', ativo: true,
  created_at: '', updated_at: '',
  setor: { nome: 'Produção' }, setor_id: 's1',
  categoria_id: 'c1',
  ...over,
} as Funcionario);

describe('matchesOccurrenceSearch', () => {
  const f = mkFuncionario();
  it('busca vazia sempre casa', () => { expect(matchesOccurrenceSearch(f, '')).toBe(true); });
  it('busca por nome (case-insensitive)', () => { expect(matchesOccurrenceSearch(f, 'joão')).toBe(true); });
  it('busca por código', () => { expect(matchesOccurrenceSearch(f, '0001')).toBe(true); });
  it('busca por setor', () => { expect(matchesOccurrenceSearch(f, 'produ')).toBe(true); });
  it('termo sem correspondência não casa', () => { expect(matchesOccurrenceSearch(f, 'zzz')).toBe(false); });
});

describe('matchesOccurrenceFilters', () => {
  const f = mkFuncionario();
  const ctx = { baseline: { f1: { faltas: 1, advertencias: 0 } }, draft: { f1: { faltas: 2, advertencias: 0 } } };

  it('filtro "somente alterados" respeita o diff baseline vs draft', () => {
    expect(matchesOccurrenceFilters(f, { ...DEFAULT_OCCURRENCE_FILTERS, somenteAlterados: true }, ctx)).toBe(true);
    const semAlteracao = { baseline: { f1: { faltas: 2, advertencias: 0 } }, draft: { f1: { faltas: 2, advertencias: 0 } } };
    expect(matchesOccurrenceFilters(f, { ...DEFAULT_OCCURRENCE_FILTERS, somenteAlterados: true }, semAlteracao)).toBe(false);
  });

  it('filtro "somente com ocorrência" exige faltas ou advertências > 0', () => {
    expect(matchesOccurrenceFilters(f, { ...DEFAULT_OCCURRENCE_FILTERS, somenteComOcorrencia: true }, ctx)).toBe(true);
    const zerado = { baseline: {}, draft: { f1: { faltas: 0, advertencias: 0 } } };
    expect(matchesOccurrenceFilters(f, { ...DEFAULT_OCCURRENCE_FILTERS, somenteComOcorrencia: true }, zerado)).toBe(false);
  });

  it('filtro por setor "__sem_setor__" exclui funcionário com setor', () => {
    expect(matchesOccurrenceFilters(f, { ...DEFAULT_OCCURRENCE_FILTERS, setorId: '__sem_setor__' }, ctx)).toBe(false);
  });
});
