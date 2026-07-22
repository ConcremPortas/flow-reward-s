import { describe, it, expect } from 'vitest';
import { buildInsights } from './indicatorInsights';
import { buildPoint } from './indicatorCalculations';
import { resolveIndicatorDefinition } from './indicatorDefinitions';
import type { GeneralIndicatorCardData } from '../types/general-indicators.types';
import type { IndicadorGeral } from '@/hooks/useIndicadoresGerais';

const FAT = resolveIndicatorDefinition('FAT');
const mkPoint = (meta: number | null, realizado: number | null) =>
  buildPoint({ id: 'r', tipo_indicador_id: 't', competencia: '2026-05-01', meta: meta as number, realizado: realizado as number, percentual: 0, created_at: '', updated_at: '' } as IndicadorGeral, FAT);

const baseCard = (over: Partial<GeneralIndicatorCardData>): GeneralIndicatorCardData => ({
  tipoId: 't', codigo: 'FAT', nome: 'Faturamento', atual: null, anterior: null, serie: [],
  variacaoRealizado: null, variacaoPP: null, tendencia: null, quality: [], ...over,
});

const codes = (cards: GeneralIndicatorCardData[]) => buildInsights(cards).map((i) => i.code);

describe('buildInsights', () => {
  it('indicador abaixo da meta + queda', () => {
    const c = codes([baseCard({ atual: mkPoint(1_000_000, 800_000), variacaoRealizado: -12 })]);
    expect(c).toContain('abaixo');
    expect(c).toContain('queda');
  });

  it('indicador superado + crescimento + melhora de atingimento', () => {
    const c = codes([baseCard({ atual: mkPoint(1_000_000, 1_100_000), variacaoRealizado: 12, variacaoPP: 8 })]);
    expect(c).toContain('superada');
    expect(c).toContain('crescimento');
    expect(c).toContain('melhora_ating');
  });

  it('meta zero e sem dados', () => {
    expect(codes([baseCard({ atual: mkPoint(0, 100) })])).toContain('meta_zero');
    expect(codes([baseCard({ atual: null })])).toContain('sem_dados');
  });

  it('anomalia de qualidade vira insight de atenção', () => {
    const c = codes([baseCard({ atual: mkPoint(1_000_000, 1), quality: [{ severity: 'warning', code: 'placeholder_um', title: 'x', message: 'y' }] })]);
    expect(c).toContain('inconsistencia');
  });

  it('ordena por severidade (alta primeiro)', () => {
    const insights = buildInsights([baseCard({ atual: mkPoint(1_000_000, 800_000), variacaoRealizado: -12 })]);
    expect(insights[0].severity).toBe('alta');
  });
});
