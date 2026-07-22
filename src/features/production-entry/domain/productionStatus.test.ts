import { describe, it, expect } from 'vitest';
import { classifySituacao, situacaoLabel } from './productionStatus';

describe('classifySituacao (regras preservadas da tela legada)', () => {
  it('>= 100 → superada', () => {
    expect(classifySituacao(100, true)).toBe('superada');
    expect(classifySituacao(150.4, true)).toBe('superada');
  });
  it('90..99 → proxima', () => {
    expect(classifySituacao(90, true)).toBe('proxima');
    expect(classifySituacao(99.9, true)).toBe('proxima');
  });
  it('< 90 → abaixo', () => {
    expect(classifySituacao(89.9, true)).toBe('abaixo');
    expect(classifySituacao(0, true)).toBe('abaixo');
  });
  it('sem registro ou percentual nulo → pendente', () => {
    expect(classifySituacao(null, false)).toBe('pendente');
    expect(classifySituacao(null, true)).toBe('pendente');
    expect(classifySituacao(50, false)).toBe('pendente');
  });
  it('rótulos em pt-BR', () => {
    expect(situacaoLabel('superada')).toBe('Meta superada');
    expect(situacaoLabel('proxima')).toBe('Próximo da meta');
    expect(situacaoLabel('abaixo')).toBe('Abaixo da meta');
    expect(situacaoLabel('pendente')).toBe('Pendente');
  });
});
