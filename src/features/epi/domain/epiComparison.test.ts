import { describe, it, expect } from 'vitest';
import { computeComplianceDiff } from './epiComparison';

describe('computeComplianceDiff', () => {
  it('sem alterações → 0 alterados', () => {
    const diff = computeComplianceDiff({ f1: true, f2: true }, { f1: true, f2: true });
    expect(diff.totalAlterados).toBe(0);
  });

  it('detecta funcionário marcado como não conforme', () => {
    const diff = computeComplianceDiff({ f1: true, f2: true }, { f1: true, f2: false });
    expect(diff.totalAlterados).toBe(1);
    expect(diff.changedIds).toEqual(['f2']);
  });

  it('ausência no map equivale a conforme (regra preservada)', () => {
    const diff = computeComplianceDiff({}, { f1: true });
    expect(diff.totalAlterados).toBe(0);
  });

  it('detecta múltiplas alterações em ambas as direções', () => {
    const diff = computeComplianceDiff({ f1: true, f2: false }, { f1: false, f2: true });
    expect(diff.totalAlterados).toBe(2);
  });
});
