import { describe, it, expect } from 'vitest';
import { compareIndicator } from './indicatorComparison';
import { buildPoint } from './indicatorCalculations';
import { resolveIndicatorDefinition } from './indicatorDefinitions';
import type { IndicadorGeral } from '@/hooks/useIndicadoresGerais';

const FAT = resolveIndicatorDefinition('FAT');
const mkReg = (competencia: string, meta: number, realizado: number): IndicadorGeral => ({
  id: `r-${competencia}`, tipo_indicador_id: 't-fat', competencia, meta, realizado, percentual: Math.round(realizado / meta * 100), created_at: '', updated_at: '',
});

describe('compareIndicator', () => {
  const points = [
    buildPoint(mkReg('2026-04-01', 1_000_000, 800_000), FAT),  // 80%
    buildPoint(mkReg('2026-05-01', 1_000_000, 1_000_000), FAT), // 100%
  ];

  it('distingue variação do realizado (%) da variação de atingimento (p.p.)', () => {
    const row = compareIndicator(points, '2026-05', '2026-04', { tipoId: 't-fat', codigo: 'FAT', label: 'Faturamento' });
    expect(row.realizadoAnterior).toBe(800_000);
    expect(row.realizadoAtual).toBe(1_000_000);
    expect(row.variacaoRealizado).toBeCloseTo(25, 5);   // +25% de realizado
    expect(row.atingimentoAnterior).toBe(80);
    expect(row.atingimentoAtual).toBe(100);
    expect(row.variacaoPP).toBe(20);                    // +20 p.p. (não 25%)
  });

  it('competência ausente → nulos', () => {
    const row = compareIndicator(points, '2026-06', '2026-05', { tipoId: 't-fat', codigo: 'FAT', label: 'Faturamento' });
    expect(row.realizadoAtual).toBeNull();
    expect(row.variacaoRealizado).toBeNull();
  });
});
