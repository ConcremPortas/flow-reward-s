import { describe, it, expect } from 'vitest';
import { matchesIndicatorFilters, matchesHistoryFilters, countActiveFilters, competenciasFromRegistros } from './indicatorFilters';
import { buildSectorRows, emptyEntry, makeSemMedicaoEntry } from './indicatorCalculations';
import { DEFAULT_INDICATOR_FILTERS, DEFAULT_INDICATOR_HISTORY_FILTERS } from '../types/sector-indicators.types';
import type { Setor } from '@/hooks/useSetores';

const mkSetor = (id: string, nome: string, empresaId = 'e1'): Setor =>
  ({ id, nome, ativo: true, empresa_id: empresaId, empresa: { nome: 'Concrem' }, created_at: '', updated_at: '' } as Setor);

const [rowSuperada, rowAbaixo, rowSem] = buildSectorRows({
  setoresPrevistos: [mkSetor('s1', 'Montagem'), mkSetor('s2', 'Pintura'), mkSetor('s3', 'Solda')],
  draft: {
    s1: { ...emptyEntry(), hora_maquina: { meta: 100, realizado: 120 } },
    s2: { ...emptyEntry(), hora_maquina: { meta: 100, realizado: 50 } },
    s3: makeSemMedicaoEntry(),
  },
  registroIdIndex: { s1: 'r1', s2: 'r2', s3: 'r3' },
});

describe('matchesIndicatorFilters', () => {
  it('busca por nome de setor', () => {
    expect(matchesIndicatorFilters(rowSuperada, { ...DEFAULT_INDICATOR_FILTERS, search: 'mont' }, false)).toBe(true);
    expect(matchesIndicatorFilters(rowSuperada, { ...DEFAULT_INDICATOR_FILTERS, search: 'pint' }, false)).toBe(false);
  });
  it('filtro por situação e sem medição', () => {
    expect(matchesIndicatorFilters(rowSuperada, { ...DEFAULT_INDICATOR_FILTERS, situacao: 'superada' }, false)).toBe(true);
    expect(matchesIndicatorFilters(rowAbaixo, { ...DEFAULT_INDICATOR_FILTERS, situacao: 'superada' }, false)).toBe(false);
    expect(matchesIndicatorFilters(rowSem, { ...DEFAULT_INDICATOR_FILTERS, semMedicao: true }, false)).toBe(true);
    expect(matchesIndicatorFilters(rowSuperada, { ...DEFAULT_INDICATOR_FILTERS, semMedicao: true }, false)).toBe(false);
  });
  it('somente alterados usa o flag isChanged', () => {
    expect(matchesIndicatorFilters(rowSuperada, { ...DEFAULT_INDICATOR_FILTERS, somenteAlterados: true }, false)).toBe(false);
    expect(matchesIndicatorFilters(rowSuperada, { ...DEFAULT_INDICATOR_FILTERS, somenteAlterados: true }, true)).toBe(true);
  });
  it('contagem de filtros ativos', () => {
    expect(countActiveFilters({ ...DEFAULT_INDICATOR_FILTERS, situacao: 'abaixo', semMedicao: true })).toBe(2);
  });
});

describe('matchesHistoryFilters', () => {
  const hist = { ...rowSuperada, competencia: '2026-05' };
  it('intervalo de competência', () => {
    expect(matchesHistoryFilters(hist, { ...DEFAULT_INDICATOR_HISTORY_FILTERS, competenciaInicial: '2026-01', competenciaFinal: '2026-12' })).toBe(true);
    expect(matchesHistoryFilters(hist, { ...DEFAULT_INDICATOR_HISTORY_FILTERS, competenciaInicial: '2026-06' })).toBe(false);
  });
  it('filtro por indicador exige percentual calculável', () => {
    expect(matchesHistoryFilters(hist, { ...DEFAULT_INDICATOR_HISTORY_FILTERS, indicatorId: 'hora_maquina' })).toBe(true);
    expect(matchesHistoryFilters(hist, { ...DEFAULT_INDICATOR_HISTORY_FILTERS, indicatorId: 'operacao_segura' })).toBe(false);
  });
});

describe('competenciasFromRegistros', () => {
  it('extrai competências únicas, mais recentes primeiro', () => {
    expect(competenciasFromRegistros(['2026-04-01', '2026-05-01', '2026-04-01', null])).toEqual(['2026-05', '2026-04']);
  });
});
