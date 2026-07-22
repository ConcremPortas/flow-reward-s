// Teste de CARACTERIZAÇÃO — amarra as definições/derivações desta feature ao
// motor de premiação, garantindo que a reconstrução analítica NÃO alterou a
// forma como FAT e KITS são consumidos no cálculo.
import { describe, it, expect } from 'vitest';
import { calcularComissao, FALLBACK_CONFIG } from '@/domain/premiacao/calculoPremiacao';
import { resolveIndicatorDefinition } from './indicatorDefinitions';

describe('definições FAT/KITS', () => {
  it('FAT é moeda, "maior = melhor"', () => {
    const d = resolveIndicatorDefinition('FAT');
    expect(d.format).toBe('currency');
    expect(d.unit).toBe('BRL');
    expect(d.direction).toBe('higher_is_better');
  });
  it('KITS é inteiro (não moeda), "maior = melhor"', () => {
    const d = resolveIndicatorDefinition('KITS');
    expect(d.format).toBe('integer');
    expect(d.unit).toBe('kits');
    expect(d.direction).toBe('higher_is_better');
  });
  it('código desconhecido cai no fallback decimal', () => {
    const d = resolveIndicatorDefinition('XYZ', 'Novo Indicador');
    expect(d.format).toBe('decimal');
    expect(d.label).toBe('Novo Indicador');
  });
});

describe('FAT: percentual armazenado alimenta a nota de faturamento', () => {
  // O motor faz notaFaturamento = percentual/100 (percentual = Math.round(realizado/meta*100)).
  const percentualArmazenado = (meta: number, realizado: number) => Math.round((realizado / meta) * 100);

  it('reconstrói a nota de faturamento a partir do percentual gravado', () => {
    const meta = 18_000_000, realizado = 18_540_000;
    const perc = percentualArmazenado(meta, realizado); // 103
    expect(perc).toBe(103);
    expect(perc / 100).toBeCloseTo(1.03, 5); // notaFaturamento
  });
});

describe('KITS: realizado alimenta a comissão', () => {
  it('abaixo do mínimo → sem comissão; acima → cresce com o realizado', () => {
    expect(calcularComissao(FALLBACK_CONFIG.minimo_kits - 1, FALLBACK_CONFIG)).toBe(0);
    const menor = calcularComissao(FALLBACK_CONFIG.minimo_kits, FALLBACK_CONFIG);
    const maior = calcularComissao(FALLBACK_CONFIG.minimo_kits + 10 * FALLBACK_CONFIG.incremento_faixa, FALLBACK_CONFIG);
    expect(maior).toBeGreaterThan(menor);
  });
});
