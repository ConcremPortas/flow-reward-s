import { describe, it, expect } from 'vitest';
import {
  calcularPercentual, calcularPercentualFracao, calcularDesvio, calcularVariacaoPP,
  competenciaToDate, dateToCompetencia, competenciaShortLabelBR,
  emptyEntry, makeSemMedicaoEntry, isSemMedicaoEntry, entryHasData,
  buildEntryFromRegistro, persistFieldsFromEntry, buildBaselineFromRegistros,
  buildRegistroIdIndex, buildSectorRows, computeSummary, computeMedia, computePiorIndicador,
} from './indicatorCalculations';
import type { IndicadorSetor } from '@/hooks/useIndicadoresSetor';
import type { Setor } from '@/hooks/useSetores';

const mkSetor = (id: string, nome: string, ativo = true, empresaId = 'e1'): Setor =>
  ({ id, nome, ativo, empresa_id: empresaId, empresa: { nome: 'Concrem' }, created_at: '', updated_at: '' } as Setor);

const mkReg = (over: Partial<IndicadorSetor>): IndicadorSetor => ({
  id: over.id || 'r1', setor_id: over.setor_id || 's1', competencia: over.competencia || '2026-05-01',
  created_at: '', updated_at: '', ...over,
});

describe('atingimento / desvio / variação', () => {
  it('percentual = realizado/meta*100 (escala 0-100, sem arredondar)', () => {
    expect(calcularPercentual(98, 100)).toBe(98);
    expect(calcularPercentual(109.6, 100)).toBeCloseTo(109.6, 5);
  });
  it('meta zero / nula / realizado nulo → null (sem divisão por zero)', () => {
    expect(calcularPercentual(100, 0)).toBeNull();
    expect(calcularPercentual(100, null)).toBeNull();
    expect(calcularPercentual(null, 100)).toBeNull();
  });
  it('percentual persistido é FRAÇÃO (regra do hook legado)', () => {
    expect(calcularPercentualFracao(100, 98)).toBeCloseTo(0.98, 5);
    expect(calcularPercentualFracao(0, 5)).toBeNull();
    expect(calcularPercentualFracao(100, null)).toBe(0);
    expect(calcularPercentualFracao(100, 0)).toBe(0);
  });
  it('desvio = realizado - meta', () => {
    expect(calcularDesvio(98, 100)).toBe(-2);
    expect(calcularDesvio(null, 100)).toBeNull();
  });
  it('variação em pontos percentuais = atual - anterior', () => {
    expect(calcularVariacaoPP(98, 100)).toBe(-2);
    expect(calcularVariacaoPP(100, null)).toBeNull();
  });
});

describe('competência (sem timezone) — pt-BR', () => {
  it('YYYY-MM ↔ YYYY-MM-01', () => {
    expect(competenciaToDate('2026-04')).toBe('2026-04-01');
    expect(dateToCompetencia('2026-04-01')).toBe('2026-04');
    expect(dateToCompetencia('2026-04-01T00:00:00Z')).toBe('2026-04');
    expect(dateToCompetencia('')).toBe('');
  });
  it('rótulo curto com ano completo: abr/2026', () => {
    expect(competenciaShortLabelBR('2026-04')).toBe('abr/2026');
    expect(competenciaShortLabelBR('2026-02')).toBe('fev/2026');
  });
});

describe('entradas e "sem medição"', () => {
  it('entrada vazia tem os 5 pares nulos', () => {
    const e = emptyEntry();
    expect(Object.keys(e)).toHaveLength(5);
    expect(entryHasData(e)).toBe(false);
  });
  it('sem medição = todos os pares 1/1; detectável', () => {
    const sm = makeSemMedicaoEntry();
    expect(isSemMedicaoEntry(sm)).toBe(true);
    expect(entryHasData(sm)).toBe(true);
    const parcial = { ...sm, limpeza: { meta: 100, realizado: 90 } };
    expect(isSemMedicaoEntry(parcial)).toBe(false);
  });
});

describe('leitura e persistência de registros', () => {
  const reg = mkReg({
    hora_maquina_meta: 100, hora_maquina_realizado: 98,
    limpeza_meta: 100, limpeza_realizado: 100,
  });
  it('buildEntryFromRegistro lê os pares', () => {
    const e = buildEntryFromRegistro(reg);
    expect(e.hora_maquina).toEqual({ meta: 100, realizado: 98 });
    expect(e.limpeza).toEqual({ meta: 100, realizado: 100 });
    expect(e.operacao_segura).toEqual({ meta: null, realizado: null });
  });
  it('persistFieldsFromEntry grava 15 campos com percentual como fração', () => {
    const e = buildEntryFromRegistro(reg);
    const p = persistFieldsFromEntry(e);
    expect(p.hora_maquina_meta).toBe(100);
    expect(p.hora_maquina_realizado).toBe(98);
    expect(p.hora_maquina_percentual).toBeCloseTo(0.98, 5);
    expect(p.operacao_segura_percentual).toBeNull(); // meta nula → null
  });
});

describe('buildBaselineFromRegistros / índice', () => {
  it('mapeia por setor da competência; ignora outra competência; dedup', () => {
    const regs = [
      mkReg({ id: 'a', setor_id: 's1', competencia: '2026-05-01', hora_maquina_meta: 100, hora_maquina_realizado: 90 }),
      mkReg({ id: 'b', setor_id: 's1', competencia: '2026-05-01', hora_maquina_meta: 200, hora_maquina_realizado: 200 }), // duplicado
      mkReg({ id: 'c', setor_id: 's2', competencia: '2026-04-01', hora_maquina_meta: 50, hora_maquina_realizado: 50 }),
    ];
    const base = buildBaselineFromRegistros(regs, '2026-05');
    expect(base.s1.hora_maquina).toEqual({ meta: 100, realizado: 90 }); // primeiro
    expect(base.s2).toBeUndefined();
    expect(buildRegistroIdIndex(regs, '2026-05').s1).toBe('a');
  });
});

describe('média / pior indicador', () => {
  it('média de exibição ignora indicadores sem percentual', () => {
    const rows = buildSectorRows({
      setoresPrevistos: [mkSetor('s1', 'Montagem')],
      draft: { s1: { ...emptyEntry(), hora_maquina: { meta: 100, realizado: 80 }, limpeza: { meta: 100, realizado: 100 } } },
      registroIdIndex: { s1: 'r1' },
    });
    expect(computeMedia(rows[0].cells)).toBe(90); // (80+100)/2
    expect(computePiorIndicador(rows[0].cells)?.indicatorId).toBe('hora_maquina');
  });
});

describe('buildSectorRows + computeSummary', () => {
  const setores = [mkSetor('s1', 'Montagem'), mkSetor('s2', 'Pintura'), mkSetor('s3', 'Expedição'), mkSetor('s4', 'Solda')];

  it('deriva situação (superada/próxima/abaixo/pendente/sem medição)', () => {
    const draft = {
      s1: { ...emptyEntry(), hora_maquina: { meta: 100, realizado: 110 }, limpeza: { meta: 100, realizado: 110 } }, // 110 superada
      s2: { ...emptyEntry(), hora_maquina: { meta: 100, realizado: 97 }, limpeza: { meta: 100, realizado: 97 } },   // 97 próxima
      s3: { ...emptyEntry(), hora_maquina: { meta: 100, realizado: 80 } },                                          // 80 abaixo
      s4: makeSemMedicaoEntry(),                                                                                    // sem medição
    };
    const rows = buildSectorRows({ setoresPrevistos: setores, draft, registroIdIndex: { s1: 'r1', s2: 'r2', s3: 'r3', s4: 'r4' } });
    const by = (id: string) => rows.find((r) => r.setorId === id)!;
    expect(by('s1').situacao).toBe('superada');
    expect(by('s2').situacao).toBe('proxima');
    expect(by('s3').situacao).toBe('abaixo');
    expect(by('s4').situacao).toBe('sem_medicao');
    expect(by('s4').semMedicao).toBe(true);

    const summary = computeSummary(rows);
    expect(summary.previstos).toBe(4);
    expect(summary.apurados).toBe(4);
    expect(summary.pendentes).toBe(0);
    expect(summary.metaAtingida).toBe(1);
    expect(summary.emAtencao).toBe(1);
    expect(summary.abaixo).toBe(1);
    expect(summary.semMedicao).toBe(1);
  });

  it('setor sem dados é pendente e conta em pendentes', () => {
    const rows = buildSectorRows({ setoresPrevistos: [mkSetor('s9', 'Vazio')], draft: {}, registroIdIndex: {} });
    expect(rows[0].situacao).toBe('pendente');
    expect(computeSummary(rows).pendentes).toBe(1);
  });

  it('comparação com competência anterior calcula variação em p.p.', () => {
    const draft = { s1: { ...emptyEntry(), hora_maquina: { meta: 100, realizado: 98 } } };
    const baselineAnterior = { s1: { ...emptyEntry(), hora_maquina: { meta: 100, realizado: 100 } } };
    const rows = buildSectorRows({ setoresPrevistos: [mkSetor('s1', 'Montagem')], draft, registroIdIndex: { s1: 'r1' }, baselineAnterior });
    const cell = rows[0].cells.hora_maquina;
    expect(cell.percentualAnterior).toBe(100);
    expect(cell.variacaoPP).toBe(-2);
  });
});
