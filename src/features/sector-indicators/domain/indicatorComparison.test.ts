import { describe, it, expect } from 'vitest';
import { computeDirtyDiff } from './indicatorComparison';
import { emptyEntry } from './indicatorCalculations';
import type { SectorIndicatorDraftMap } from '../types/sector-indicators.types';

const base: SectorIndicatorDraftMap = {
  s1: { ...emptyEntry(), hora_maquina: { meta: 100, realizado: 90 } },
};

describe('computeDirtyDiff', () => {
  it('sem alterações → diff vazio', () => {
    const diff = computeDirtyDiff(base, { s1: { ...emptyEntry(), hora_maquina: { meta: 100, realizado: 90 } } });
    expect(diff.totalSetoresAlterados).toBe(0);
    expect(diff.changedFields).toHaveLength(0);
  });

  it('detecta campo alterado com anterior/novo por indicador', () => {
    const draft = { s1: { ...emptyEntry(), hora_maquina: { meta: 100, realizado: 95 } } };
    const diff = computeDirtyDiff(base, draft);
    expect(diff.totalSetoresAlterados).toBe(1);
    expect(diff.indicadoresAlterados).toBe(1);
    expect(diff.realizadosAlterados).toBe(1);
    expect(diff.metasAlteradas).toBe(0);
    expect(diff.changedFields[0]).toMatchObject({ setorId: 's1', indicatorId: 'hora_maquina', field: 'realizado', anterior: 90, novo: 95 });
  });

  it('setor novo (inexistente no baseline) com dado conta como alterado', () => {
    const draft = { ...base, s2: { ...emptyEntry(), limpeza: { meta: 100, realizado: 100 } } };
    const diff = computeDirtyDiff(base, draft);
    expect(diff.changedSetorIds).toContain('s2');
    expect(diff.totalSetoresAlterados).toBe(1);
  });
});
