import { describe, it, expect } from 'vitest';
import {
  calcularPercentual, calcularDesvio, calcularVariacao, competenciaToDate, dateToCompetencia,
  competenciaShortLabelBR, buildBaselineFromRegistros, buildProductionRows, computeSummary,
  buildRegistroIdIndex,
} from './productionCalculations';
import type { ProducaoSetor } from '@/hooks/useProducaoSetor';
import type { Setor } from '@/hooks/useSetores';

const mkSetor = (id: string, nome: string, ativo = true, empresaId = 'e1'): Setor =>
  ({ id, nome, ativo, empresa_id: empresaId, empresa: { nome: 'Concrem' }, created_at: '', updated_at: '' } as Setor);

const mkReg = (over: Partial<ProducaoSetor>): ProducaoSetor => ({
  id: over.id || 'r1', setor_id: over.setor_id || 's1', data_producao: over.data_producao || '2026-05-01',
  meta_diaria: over.meta_diaria ?? 100, producao_realizada: over.producao_realizada ?? 100,
  unidade_medida: over.unidade_medida || 'unidades', created_at: '', updated_at: '', ...over,
});

describe('percentual / desvio / variação', () => {
  it('percentual = realizado/meta*100', () => {
    expect(calcularPercentual(1096, 1000)).toBeCloseTo(109.6, 5);
    expect(calcularPercentual(90, 100)).toBe(90);
  });
  it('meta zero / nula / realizado nulo → null (sem divisão por zero)', () => {
    expect(calcularPercentual(100, 0)).toBeNull();
    expect(calcularPercentual(100, null)).toBeNull();
    expect(calcularPercentual(null, 100)).toBeNull();
  });
  it('desvio = realizado - meta', () => {
    expect(calcularDesvio(7123.33 + 100, 100)).toBeCloseTo(7123.33, 2);
    expect(calcularDesvio(95.2, 4675.2)).toBeCloseTo(-4580, 2);
    expect(calcularDesvio(null, 100)).toBeNull();
  });
  it('variação percentual vs. anterior; base zero → null', () => {
    expect(calcularVariacao(120, 100)).toBe(20);
    expect(calcularVariacao(100, 0)).toBeNull();
    expect(calcularVariacao(100, null)).toBeNull();
  });
});

describe('competência (sem timezone)', () => {
  it('YYYY-MM ↔ YYYY-MM-01', () => {
    expect(competenciaToDate('2026-05')).toBe('2026-05-01');
    expect(dateToCompetencia('2026-05-01')).toBe('2026-05');
    expect(dateToCompetencia('2026-05-01T00:00:00Z')).toBe('2026-05');
  });
  it('rótulo curto com ano completo: mai/2026', () => {
    expect(competenciaShortLabelBR('2026-05')).toBe('mai/2026');
    expect(competenciaShortLabelBR('2026-02')).toBe('fev/2026');
  });
});

describe('buildBaselineFromRegistros', () => {
  it('mapeia meta/realizado por setor da competência, ignorando indicadores (percentual)', () => {
    const regs = [
      mkReg({ id: 'a', setor_id: 's1', data_producao: '2026-05-01', meta_diaria: 1000, producao_realizada: 900 }),
      mkReg({ id: 'b', setor_id: 's2', data_producao: '2026-05-01', unidade_medida: 'percentual', meta_diaria: 100, producao_realizada: 80 }),
      mkReg({ id: 'c', setor_id: 's3', data_producao: '2026-04-01', meta_diaria: 500, producao_realizada: 500 }),
    ];
    const base = buildBaselineFromRegistros(regs, '2026-05');
    expect(base.s1).toEqual({ meta: 1000, realizado: 900 });
    expect(base.s2).toBeUndefined(); // indicador excluído
    expect(base.s3).toBeUndefined(); // outra competência
  });
  it('dedup defensivo: mantém o primeiro registro do setor', () => {
    const regs = [
      mkReg({ id: 'a', setor_id: 's1', data_producao: '2026-05-01', meta_diaria: 1000 }),
      mkReg({ id: 'b', setor_id: 's1', data_producao: '2026-05-01', meta_diaria: 2000 }),
    ];
    expect(buildBaselineFromRegistros(regs, '2026-05').s1.meta).toBe(1000);
  });
});

describe('buildProductionRows + computeSummary', () => {
  const setores = [mkSetor('s1', 'Montagem'), mkSetor('s2', 'Pintura'), mkSetor('s3', 'Expedição')];

  it('deriva situação e monta resumo (superada/próxima/abaixo/pendente)', () => {
    const regs = [
      mkReg({ id: 'a', setor_id: 's1', data_producao: '2026-05-01', meta_diaria: 100, producao_realizada: 110 }), // 110% superada
      mkReg({ id: 'b', setor_id: 's2', data_producao: '2026-05-01', meta_diaria: 100, producao_realizada: 95 }),  // 95% próxima
      // s3 sem registro → pendente
    ];
    const draft = buildBaselineFromRegistros(regs, '2026-05');
    const registroIdIndex = buildRegistroIdIndex(regs, '2026-05');
    const rows = buildProductionRows({ setoresPrevistos: setores, draft, registroIdIndex, unidadeIndex: {} });

    const s1 = rows.find((r) => r.setorId === 's1')!;
    expect(s1.situacao).toBe('superada');
    expect(s1.percentual).toBeCloseTo(110, 5);
    expect(s1.desvio).toBe(10);
    expect(rows.find((r) => r.setorId === 's2')!.situacao).toBe('proxima');
    expect(rows.find((r) => r.setorId === 's3')!.situacao).toBe('pendente');

    const summary = computeSummary(rows);
    expect(summary.previstos).toBe(3);
    expect(summary.apurados).toBe(2);
    expect(summary.pendentes).toBe(1);
    expect(summary.superada).toBe(1);
    expect(summary.proxima).toBe(1);
    expect(summary.mediaAtingimento).toBeCloseTo(102.5, 5); // (110+95)/2
  });

  it('comparação com competência anterior calcula variação do realizado', () => {
    const setores1 = [mkSetor('s1', 'Montagem')];
    const draft = { s1: { meta: 100, realizado: 120 } };
    const baselineAnterior = { s1: { meta: 100, realizado: 100 } };
    const rows = buildProductionRows({ setoresPrevistos: setores1, draft, registroIdIndex: { s1: 'r1' }, unidadeIndex: {}, baselineAnterior });
    expect(rows[0].variacaoRealizado).toBe(20);
    expect(rows[0].realizadoAnterior).toBe(100);
  });
});
