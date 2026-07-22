import { describe, it, expect } from 'vitest';
import { formatIndicatorValue, formatIndicatorDeviation } from './indicatorFormatting';
import { resolveIndicatorDefinition } from './indicatorDefinitions';

const FAT = resolveIndicatorDefinition('FAT');
const KITS = resolveIndicatorDefinition('KITS');

// Intl (moeda pt-BR) usa espaço não separável (U+00A0) após "R$"; normalizamos.
const norm = (s: string) => s.replace(/\u00A0/g, ' ');

describe('formatação de Faturamento (BRL)', () => {
  it('formata em moeda pt-BR', () => {
    expect(norm(formatIndicatorValue(18_500_000, FAT))).toBe('R$ 18.500.000,00');
  });
  it('forma compacta em milhões', () => {
    expect(norm(formatIndicatorValue(18_500_000, FAT, { compact: true }))).toBe('R$ 18,5 mi');
  });
  it('desvio com sinal', () => {
    expect(norm(formatIndicatorDeviation(850_000, FAT))).toBe('+R$ 850.000,00');
    expect(norm(formatIndicatorDeviation(-1000, FAT))).toBe('−R$ 1.000,00');
  });
});

describe('formatação de Kits (inteiro)', () => {
  it('formata inteiro pt-BR com unidade, sem moeda', () => {
    expect(formatIndicatorValue(21_116, KITS)).toBe('21.116 kits');
    expect(formatIndicatorValue(21_116, KITS)).not.toContain('R$');
  });
  it('desvio com unidade e sinal', () => {
    expect(formatIndicatorDeviation(1250, KITS)).toBe('+1.250 kits');
  });
});

describe('nulos e vazios', () => {
  it('valor ausente → travessão', () => {
    expect(formatIndicatorValue(null, FAT)).toBe('—');
    expect(formatIndicatorDeviation(null, KITS)).toBe('—');
  });
});
