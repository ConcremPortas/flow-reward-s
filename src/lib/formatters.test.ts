import { describe, it, expect } from 'vitest';
import { formatCurrencyBRL, formatNumberBR, formatPercentBR, pluralizeBR } from './formatters';

// Normaliza espaço fixo (NBSP/NNBSP) usado pelo ICU entre símbolo e valor.
const norm = (s: string) => s.replace(/[  ]/g, ' ');

describe('formatCurrencyBRL', () => {
  it('1234.56 → R$ 1.234,56', () => {
    expect(norm(formatCurrencyBRL(1234.56))).toBe('R$ 1.234,56');
  });
  it('115981.05 → R$ 115.981,05', () => {
    expect(norm(formatCurrencyBRL(115981.05))).toBe('R$ 115.981,05');
  });
  it('null/NaN → fallback', () => {
    expect(formatCurrencyBRL(null)).toBe('R$ 0,00');
    expect(formatCurrencyBRL(undefined)).toBe('R$ 0,00');
    expect(formatCurrencyBRL(NaN)).toBe('R$ 0,00');
  });
});

describe('formatNumberBR', () => {
  it('inteiro com separador de milhares: 1234 → 1.234', () => {
    expect(formatNumberBR(1234)).toBe('1.234');
  });
  it('314 → 314', () => {
    expect(formatNumberBR(314)).toBe('314');
  });
  it('com casas decimais fixas: 1234.56 → 1.234,56', () => {
    expect(formatNumberBR(1234.56, 2)).toBe('1.234,56');
  });
  it('null → fallback', () => {
    expect(formatNumberBR(null)).toBe('0');
  });
});

describe('formatPercentBR', () => {
  it('10.5 → 10,5%', () => {
    expect(formatPercentBR(10.5)).toBe('10,5%');
  });
  it('0 casas: 90 → 90%', () => {
    expect(formatPercentBR(90, 0)).toBe('90%');
  });
  it('null → fallback', () => {
    expect(formatPercentBR(null)).toBe('—');
  });
});

describe('pluralizeBR', () => {
  it('singular quando n === 1', () => {
    expect(pluralizeBR(1, 'funcionário', 'funcionários')).toBe('1 funcionário');
    expect(pluralizeBR(1, 'falta', 'faltas')).toBe('1 falta');
  });
  it('plural para 0 e n > 1', () => {
    expect(pluralizeBR(0, 'funcionário', 'funcionários')).toBe('0 funcionários');
    expect(pluralizeBR(3, 'falta', 'faltas')).toBe('3 faltas');
    expect(pluralizeBR(4, 'advertência', 'advertências')).toBe('4 advertências');
  });
  it('formata milhares no número', () => {
    expect(pluralizeBR(1500, 'auditoria', 'auditorias')).toBe('1.500 auditorias');
  });
});
