import { describe, it, expect } from 'vitest';
import { sanitizeQuantity, isValidQuantity, deriveRowStatus, NOTA_ZERO_THRESHOLD } from './occurrenceValidation';

describe('sanitizeQuantity', () => {
  it('rejeita valores negativos (nunca abaixo de 0)', () => {
    expect(sanitizeQuantity(-5)).toBe(0);
    expect(sanitizeQuantity('-3')).toBe(0);
  });
  it('aceita apenas inteiros (trunca fracionários)', () => {
    expect(sanitizeQuantity(2.9)).toBe(2);
    expect(sanitizeQuantity('3.7')).toBe(3);
  });
  it('trata entrada inválida/vazia como 0', () => {
    expect(sanitizeQuantity('')).toBe(0);
    expect(sanitizeQuantity('abc')).toBe(0);
    expect(sanitizeQuantity(NaN)).toBe(0);
  });
  it('preserva inteiros positivos válidos', () => {
    expect(sanitizeQuantity(4)).toBe(4);
    expect(sanitizeQuantity('12')).toBe(12);
  });
});

describe('isValidQuantity', () => {
  it('valida inteiros >= 0', () => {
    expect(isValidQuantity(0)).toBe(true);
    expect(isValidQuantity(5)).toBe(true);
    expect(isValidQuantity(-1)).toBe(false);
    expect(isValidQuantity(1.5)).toBe(false);
  });
});

describe('deriveRowStatus', () => {
  it('sem alteração quando draft == baseline e ambos zerados', () => {
    expect(deriveRowStatus({ baseline: { faltas: 0, advertencias: 0 }, current: { faltas: 0, advertencias: 0 } })).toBe('sem_alteracao');
  });
  it('detecta alteração quando o valor muda em relação ao baseline', () => {
    expect(deriveRowStatus({ baseline: { faltas: 0, advertencias: 0 }, current: { faltas: 2, advertencias: 0 } })).toBe('alterado');
    expect(deriveRowStatus({ baseline: { faltas: 1, advertencias: 0 }, current: { faltas: 0, advertencias: 0 } })).toBe('alterado');
  });
  it('marca com_ocorrencia quando não houve alteração mas há valor > 0 (competência já preenchida)', () => {
    expect(deriveRowStatus({ baseline: { faltas: 2, advertencias: 0 }, current: { faltas: 2, advertencias: 0 } })).toBe('com_ocorrencia');
  });
  it('marca erro para quantidade inválida', () => {
    expect(deriveRowStatus({ baseline: undefined, current: { faltas: -1, advertencias: 0 } })).toBe('erro');
  });
  it('trata baseline/current ausentes como zero', () => {
    expect(deriveRowStatus({ baseline: undefined, current: undefined })).toBe('sem_alteracao');
  });
  it('threshold de saturação da nota é 4 (regra do motor de premiação)', () => {
    expect(NOTA_ZERO_THRESHOLD).toBe(4);
  });
});
