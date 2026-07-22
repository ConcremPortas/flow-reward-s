import { describe, it, expect } from 'vitest';
import { calcularAtingimento, classifyGeneralSituacao, LIMITE_SUPERADA, LIMITE_ATINGIDA, LIMITE_ATENCAO } from './indicatorStatus';

describe('calcularAtingimento (direção da meta)', () => {
  it('higher_is_better = realizado/meta*100', () => {
    expect(calcularAtingimento(1_050_000, 1_000_000, 'higher_is_better')).toBeCloseTo(105, 5);
    expect(calcularAtingimento(90, 100, 'higher_is_better')).toBe(90);
  });
  it('lower_is_better = meta/realizado*100 (invertido)', () => {
    expect(calcularAtingimento(80, 100, 'lower_is_better')).toBe(125); // realizou menos que a meta = bom
    expect(calcularAtingimento(120, 100, 'lower_is_better')).toBeCloseTo(83.33, 1);
  });
  it('meta zero / nula / realizado nulo → null', () => {
    expect(calcularAtingimento(100, 0, 'higher_is_better')).toBeNull();
    expect(calcularAtingimento(100, null, 'higher_is_better')).toBeNull();
    expect(calcularAtingimento(null, 100, 'higher_is_better')).toBeNull();
    expect(calcularAtingimento(0, 100, 'lower_is_better')).toBeNull();
  });
});

describe('classifyGeneralSituacao', () => {
  it('sem dados', () => {
    expect(classifyGeneralSituacao(null, false)).toBe('sem_dados');
    expect(classifyGeneralSituacao(null, true)).toBe('sem_dados');
  });
  it('limiares superada/atingida/atenção/abaixo', () => {
    expect(classifyGeneralSituacao(LIMITE_SUPERADA, true)).toBe('superada');
    expect(classifyGeneralSituacao(LIMITE_ATINGIDA, true)).toBe('atingida');
    expect(classifyGeneralSituacao(104.9, true)).toBe('atingida');
    expect(classifyGeneralSituacao(LIMITE_ATENCAO, true)).toBe('atencao');
    expect(classifyGeneralSituacao(89.9, true)).toBe('abaixo');
  });
});
