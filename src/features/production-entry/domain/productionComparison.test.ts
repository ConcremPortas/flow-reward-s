import { describe, it, expect } from 'vitest';
import { computeDirtyDiff } from './productionComparison';

describe('computeDirtyDiff', () => {
  it('sem alterações → 0', () => {
    const base = { s1: { meta: 100, realizado: 90 } };
    expect(computeDirtyDiff(base, base).totalSetoresAlterados).toBe(0);
  });
  it('detecta meta e realizado alterados separadamente', () => {
    const base = { s1: { meta: 100, realizado: 90 }, s2: { meta: 50, realizado: 50 } };
    const draft = { s1: { meta: 120, realizado: 95 }, s2: { meta: 50, realizado: 50 } };
    const diff = computeDirtyDiff(base, draft);
    expect(diff.totalSetoresAlterados).toBe(1);
    expect(diff.metasAlteradas).toBe(1);
    expect(diff.realizadosAlterados).toBe(1);
    expect(diff.changedFields).toHaveLength(2);
  });
  it('preenchimento de setor pendente (null → valor) conta como alteração', () => {
    const base = { s1: { meta: null, realizado: null } };
    const draft = { s1: { meta: 100, realizado: 80 } };
    const diff = computeDirtyDiff(base, draft);
    expect(diff.totalSetoresAlterados).toBe(1);
    expect(diff.changedFields[0].anterior).toBeNull();
    expect(diff.changedFields[0].novo).toBe(100);
  });
});
