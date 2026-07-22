import { describe, it, expect } from 'vitest';
import { computePresenceDiff, percentVariation } from './dssComparison';

describe('computePresenceDiff', () => {
  it('nenhuma alteração quando presença atual é igual à inicial', () => {
    const diff = computePresenceDiff({ f1: true, f2: false }, { f1: true, f2: false });
    expect(diff.totalAlterados).toBe(0);
  });

  it('detecta alterações de presente->ausente e ausente->presente', () => {
    const diff = computePresenceDiff({ f1: true, f2: false }, { f1: false, f2: true });
    expect(diff.totalAlterados).toBe(2);
    expect(diff.changedIds.sort()).toEqual(['f1', 'f2']);
  });

  it('trata ausência de chave como false (ausente) em ambos os lados', () => {
    const diff = computePresenceDiff({}, { f1: false });
    expect(diff.totalAlterados).toBe(0);
  });

  it('restauração: draft igual ao baseline novamente zera o diff', () => {
    const baseline = { f1: true };
    let draft = { f1: false };
    expect(computePresenceDiff(baseline, draft).totalAlterados).toBe(1);
    draft = { f1: true };
    expect(computePresenceDiff(baseline, draft).totalAlterados).toBe(0);
  });
});

describe('percentVariation (reexport)', () => {
  it('está disponível e funciona (não duplicado)', () => {
    expect(percentVariation(120, 100)).toBe(20);
  });
});
