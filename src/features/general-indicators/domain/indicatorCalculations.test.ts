import { describe, it, expect } from 'vitest';
import {
  competenciaToDate, dateToCompetencia, competenciaShortLabelBR,
  calcularDesvio, calcularVariacao, calcularVariacaoPP, median, computeTrend,
  buildPoint, pointsByTipo, seriesForTipo, buildCardData, latestCompetencia,
} from './indicatorCalculations';
import { resolveIndicatorDefinition } from './indicatorDefinitions';
import type { IndicadorGeral } from '@/hooks/useIndicadoresGerais';
import type { TipoIndicadorGeral } from '@/hooks/useTiposIndicadoresGerais';

const FAT_TIPO: TipoIndicadorGeral = { id: 't-fat', nome: 'Faturamento', codigo: 'FAT', ativo: true, created_at: '', updated_at: '' };
const FAT = resolveIndicatorDefinition('FAT');

const mkReg = (over: Partial<IndicadorGeral>): IndicadorGeral => ({
  id: over.id || 'r1', tipo_indicador_id: over.tipo_indicador_id || 't-fat',
  competencia: over.competencia || '2026-05-01', meta: over.meta ?? 1_000_000, realizado: over.realizado ?? 900_000,
  percentual: over.percentual ?? 90, created_at: '', updated_at: '',
  tipo_indicador: { id: 't-fat', nome: 'Faturamento', codigo: 'FAT' }, ...over,
});

describe('competência (sem timezone)', () => {
  it('YYYY-MM ↔ YYYY-MM-01', () => {
    expect(competenciaToDate('2026-05')).toBe('2026-05-01');
    expect(dateToCompetencia('2026-05-01')).toBe('2026-05');
    expect(dateToCompetencia('2026-05-01T00:00:00Z')).toBe('2026-05');
  });
  it('rótulo curto com ano completo: mai/2026', () => {
    expect(competenciaShortLabelBR('2026-05')).toBe('mai/2026');
  });
});

describe('aritmética', () => {
  it('desvio / variação / p.p.', () => {
    expect(calcularDesvio(900, 1000)).toBe(-100);
    expect(calcularVariacao(120, 100)).toBe(20);
    expect(calcularVariacao(100, 0)).toBeNull();
    expect(calcularVariacaoPP(98, 100)).toBe(-2);
  });
  it('mediana', () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(median([null, undefined])).toBeNull();
  });
  it('tendência exige histórico mínimo (>=3)', () => {
    expect(computeTrend([100, 110])).toBeNull();
    expect(computeTrend([100, 110, 130])).toBe('up');
    expect(computeTrend([130, 110, 100])).toBe('down');
    expect(computeTrend([100, 101, 100])).toBe('flat');
  });
});

describe('buildPoint', () => {
  it('deriva atingimento/desvio/situação e mantém percentual armazenado', () => {
    const p = buildPoint(mkReg({ meta: 1_000_000, realizado: 1_050_000, percentual: 105 }), FAT);
    expect(p.competencia).toBe('2026-05');
    expect(p.atingimento).toBeCloseTo(105, 5);
    expect(p.desvio).toBe(50_000);
    expect(p.percentualArmazenado).toBe(105);
    expect(p.situacao).toBe('superada');
  });
});

describe('pointsByTipo / seriesForTipo / buildCardData', () => {
  const tiposById = new Map([[FAT_TIPO.id, FAT_TIPO]]);
  const regs = [
    mkReg({ id: 'a', competencia: '2026-03-01', meta: 1_000_000, realizado: 800_000 }),
    mkReg({ id: 'b', competencia: '2026-04-01', meta: 1_000_000, realizado: 900_000 }),
    mkReg({ id: 'c', competencia: '2026-05-01', meta: 1_000_000, realizado: 1_100_000 }),
  ];

  it('agrupa e ordena por competência asc', () => {
    const map = pointsByTipo(regs, tiposById);
    const pts = map.get('t-fat')!;
    expect(pts.map((p) => p.competencia)).toEqual(['2026-03', '2026-04', '2026-05']);
  });

  it('série de 12 competências termina na competência dada (nulos nos meses ausentes)', () => {
    const map = pointsByTipo(regs, tiposById);
    const serie = seriesForTipo(map.get('t-fat')!, '2026-05', 12);
    expect(serie).toHaveLength(12);
    expect(serie[serie.length - 1]?.competencia).toBe('2026-05');
    expect(serie[0]).toBeNull(); // 2025-06 ausente
  });

  it('card monta atual/anterior/variações/tendência', () => {
    const map = pointsByTipo(regs, tiposById);
    const card = buildCardData(FAT_TIPO, map.get('t-fat')!, '2026-05');
    expect(card.atual?.realizado).toBe(1_100_000);
    expect(card.anterior?.realizado).toBe(900_000);
    expect(card.variacaoRealizado).toBeCloseTo(22.22, 1); // (1.1M-0.9M)/0.9M
    expect(card.variacaoPP).toBeCloseTo(20, 5);            // 110% - 90%
    expect(card.tendencia).toBe('up');
  });
});

describe('latestCompetencia', () => {
  it('retorna a competência mais recente com dado', () => {
    expect(latestCompetencia([mkReg({ competencia: '2026-04-01' }), mkReg({ competencia: '2026-06-01' })])).toBe('2026-06');
    expect(latestCompetencia([])).toBe('');
  });
});
