import { describe, it, expect } from 'vitest';
import { classifyCellState, classifySectorSituacao, LIMITE_ATINGIDO, LIMITE_ATENCAO } from './indicatorStatus';

describe('classifyCellState', () => {
  it('sem medição vence tudo', () => {
    expect(classifyCellState(150, { hasData: true, semMedicao: true })).toBe('sem_medicao');
  });
  it('sem dados / percentual nulo → pendente', () => {
    expect(classifyCellState(null, { hasData: false, semMedicao: false })).toBe('pendente');
    expect(classifyCellState(null, { hasData: true, semMedicao: false })).toBe('pendente');
  });
  it('limiares: atingido >= 100, atenção >= 95, abaixo < 95', () => {
    expect(classifyCellState(LIMITE_ATINGIDO, { hasData: true, semMedicao: false })).toBe('atingido');
    expect(classifyCellState(LIMITE_ATENCAO, { hasData: true, semMedicao: false })).toBe('atencao');
    expect(classifyCellState(94.9, { hasData: true, semMedicao: false })).toBe('abaixo');
  });
});

describe('classifySectorSituacao', () => {
  it('sem medição / pendente', () => {
    expect(classifySectorSituacao(100, { temDados: true, semMedicao: true })).toBe('sem_medicao');
    expect(classifySectorSituacao(null, { temDados: false, semMedicao: false })).toBe('pendente');
  });
  it('superada / próxima / abaixo', () => {
    expect(classifySectorSituacao(100, { temDados: true, semMedicao: false })).toBe('superada');
    expect(classifySectorSituacao(96, { temDados: true, semMedicao: false })).toBe('proxima');
    expect(classifySectorSituacao(80, { temDados: true, semMedicao: false })).toBe('abaixo');
  });
});
