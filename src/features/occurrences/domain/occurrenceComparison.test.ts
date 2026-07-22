import { describe, it, expect } from 'vitest';
import { computeDirtyDiff, percentVariation } from './occurrenceComparison';

describe('computeDirtyDiff', () => {
  it('não acusa alteração quando draft é idêntico ao baseline', () => {
    const baseline = { a: { faltas: 1, advertencias: 0 } };
    const draft = { a: { faltas: 1, advertencias: 0 } };
    const diff = computeDirtyDiff(baseline, draft);
    expect(diff.totalFuncionariosAlterados).toBe(0);
    expect(diff.changedIds).toEqual([]);
  });

  it('detecta funcionário alterado e calcula deltas de faltas/advertências', () => {
    const baseline = { a: { faltas: 1, advertencias: 0 }, b: { faltas: 0, advertencias: 0 } };
    const draft = { a: { faltas: 2, advertencias: 1 }, b: { faltas: 0, advertencias: 0 } };
    const diff = computeDirtyDiff(baseline, draft);
    expect(diff.totalFuncionariosAlterados).toBe(1);
    expect(diff.changedIds).toEqual(['a']);
    expect(diff.totalFaltasDelta).toBe(1);
    expect(diff.totalAdvertenciasDelta).toBe(1);
  });

  it('considera funcionário novo no draft (ausente no baseline) como alterado', () => {
    const diff = computeDirtyDiff({}, { c: { faltas: 3, advertencias: 0 } });
    expect(diff.totalFuncionariosAlterados).toBe(1);
    expect(diff.entries[0].before).toEqual({ faltas: 0, advertencias: 0 });
  });

  it('restauração: voltar o draft ao baseline zera o diff', () => {
    const baseline = { a: { faltas: 1, advertencias: 0 } };
    let draft = { a: { faltas: 5, advertencias: 2 } };
    expect(computeDirtyDiff(baseline, draft).totalFuncionariosAlterados).toBe(1);
    draft = { a: { ...baseline.a } }; // restaura
    expect(computeDirtyDiff(baseline, draft).totalFuncionariosAlterados).toBe(0);
  });
});

describe('percentVariation', () => {
  it('calcula variação percentual normal', () => {
    expect(percentVariation(150, 100)).toBe(50);
    expect(percentVariation(50, 100)).toBe(-50);
  });
  it('retorna null quando não há base para comparar (evita divisão por zero)', () => {
    expect(percentVariation(5, 0)).toBeNull();
  });
  it('retorna 0 quando ambos os períodos são zero', () => {
    expect(percentVariation(0, 0)).toBe(0);
  });
});
