import { describe, it, expect } from 'vitest';
import { analyzePoint, hasAnomaly, DEFAULT_QUALITY_CONFIG } from './indicatorDataQuality';
import { buildPoint } from './indicatorCalculations';
import { resolveIndicatorDefinition } from './indicatorDefinitions';
import type { IndicadorGeral } from '@/hooks/useIndicadoresGerais';

const FAT = resolveIndicatorDefinition('FAT');
const mkPoint = (competencia: string, meta: number | null, realizado: number | null) =>
  buildPoint({ id: `r-${competencia}`, tipo_indicador_id: 't-fat', competencia: `${competencia}-01`, meta: meta as number, realizado: realizado as number, percentual: 0, created_at: '', updated_at: '' } as IndicadorGeral, FAT);

// Histórico "milionário" com 3+ competências.
const historico = [
  mkPoint('2026-01', 18_000_000, 18_200_000),
  mkPoint('2026-02', 18_000_000, 17_900_000),
  mkPoint('2026-03', 18_000_000, 18_500_000),
];

describe('regras de qualidade', () => {
  it('meta zero é sinalizada', () => {
    const signals = analyzePoint(mkPoint('2026-04', 0, 100), historico);
    expect(signals.some((s) => s.code === 'meta_zero')).toBe(true);
  });

  it('realizado = 1 em indicador milionário → placeholder', () => {
    const p = mkPoint('2026-04', 18_000_000, 1);
    const signals = analyzePoint(p, [...historico, p]);
    expect(signals.some((s) => s.code === 'placeholder_um')).toBe(true);
    expect(hasAnomaly(signals)).toBe(true);
  });

  it('mudança extrema de escala (5×+) → scale_change', () => {
    const p = mkPoint('2026-04', 18_000_000, 200_000_000); // ~11x a mediana
    const signals = analyzePoint(p, [...historico, p]);
    expect(signals.some((s) => s.code === 'scale_change')).toBe(true);
  });

  it('sem histórico mínimo → não dispara regra de escala (evita falso positivo)', () => {
    const curto = [mkPoint('2026-03', 18_000_000, 18_000_000)];
    const p = mkPoint('2026-04', 18_000_000, 1);
    const signals = analyzePoint(p, [...curto, p]);
    expect(signals.some((s) => s.code === 'placeholder_um')).toBe(false);
  });

  it('valor normal não gera anomalia', () => {
    const p = mkPoint('2026-04', 18_000_000, 18_300_000);
    expect(hasAnomaly(analyzePoint(p, [...historico, p]))).toBe(false);
  });

  it('config exige o mínimo de histórico configurado', () => {
    expect(DEFAULT_QUALITY_CONFIG.minHistorico).toBeGreaterThanOrEqual(3);
  });
});
