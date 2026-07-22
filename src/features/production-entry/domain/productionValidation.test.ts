import { describe, it, expect } from 'vitest';
import { parseNumberBR, sanitizeProductionValue } from './productionValidation';

describe('parseNumberBR', () => {
  it('aceita formato pt-BR e en', () => {
    expect(parseNumberBR('1.234,56')).toBeCloseTo(1234.56, 2);
    expect(parseNumberBR('1234,56')).toBeCloseTo(1234.56, 2);
    expect(parseNumberBR('1234.56')).toBeCloseTo(1234.56, 2);
    expect(parseNumberBR('1234')).toBe(1234);
    expect(parseNumberBR(4321.5)).toBe(4321.5);
  });
  it('vazio/ inválido → null', () => {
    expect(parseNumberBR('')).toBeNull();
    expect(parseNumberBR('  ')).toBeNull();
    expect(parseNumberBR('abc')).toBeNull();
    expect(parseNumberBR(null)).toBeNull();
  });
});

describe('sanitizeProductionValue', () => {
  it('preserva decimais e null para vazio', () => {
    expect(sanitizeProductionValue('1.234,56')).toBeCloseTo(1234.56, 2);
    expect(sanitizeProductionValue('')).toBeNull();
  });
  it('clampa negativos a 0 (regra atual proíbe negativos)', () => {
    expect(sanitizeProductionValue('-50')).toBe(0);
  });
});
