import { describe, it, expect } from 'vitest';
import {
  buildLocationSummary, buildHistoryRows, buildDssMonthlyEvolution,
  computeLowParticipation, computeTemaDistribution, computeLocaisAbaixoReferencia,
} from './dssCalculations';
import type { DSS } from '@/hooks/useDSS';
import type { Funcionario } from '@/hooks/useFuncionarios';

const mkDss = (over: Partial<DSS>): DSS => ({
  id: Math.random().toString(36), titulo: 'DSS', data_realizacao: '2026-05-10',
  created_at: '', updated_at: '', participantes_ids: [], ...over,
} as DSS);

const mkFuncionario = (over: Partial<Funcionario>): Funcionario => ({
  id: 'f1', nome: 'Func', ativo: true, created_at: '', updated_at: '', ...over,
} as Funcionario);

describe('buildLocationSummary', () => {
  const funcionarios = [
    mkFuncionario({ id: 'f1', local_dss_id: 'l1', ativo: true }),
    mkFuncionario({ id: 'f2', local_dss_id: 'l1', ativo: true }),
  ];

  it('retorna vinculados, último DSS e participação média calculável', () => {
    const dss = [
      mkDss({ local_dss_id: 'l1', data_realizacao: '2026-04-01', titulo: 'Abril', participantes_ids: ['f1'] }),
      mkDss({ local_dss_id: 'l1', data_realizacao: '2026-05-01', titulo: 'Maio', participantes_ids: ['f1', 'f2'] }),
    ];
    const now = new Date('2026-05-15T12:00:00');
    const s = buildLocationSummary(dss, funcionarios, 'l1', now);
    expect(s.vinculados).toBe(2);
    expect(s.ultimoDss).toEqual({ data: '2026-05-01', tema: 'Maio' });
    expect(s.dssRecentes).toBe(2); // ambos dentro de 90 dias de 2026-05-15
    expect(s.participacaoMedia).toBe(75); // (50%+100%)/2
  });

  it('local sem funcionários vinculados retorna participação nula (não inventa dado)', () => {
    const s = buildLocationSummary([mkDss({ local_dss_id: 'l2' })], [], 'l2', new Date('2026-05-15T12:00:00'));
    expect(s.vinculados).toBe(0);
    expect(s.participacaoMedia).toBeNull();
  });

  it('local sem nenhum DSS anterior retorna ultimoDss null', () => {
    const s = buildLocationSummary([], funcionarios, 'l1', new Date('2026-05-15T12:00:00'));
    expect(s.ultimoDss).toBeNull();
  });
});

describe('buildHistoryRows', () => {
  it('calcula participação com base no vínculo atual ao local', () => {
    const funcionarios = [mkFuncionario({ id: 'f1', local_dss_id: 'l1', ativo: true }), mkFuncionario({ id: 'f2', local_dss_id: 'l1', ativo: true })];
    const rows = buildHistoryRows([mkDss({ local_dss_id: 'l1', participantes_ids: ['f1'] })], funcionarios);
    expect(rows[0].totalVinculado).toBe(2);
    expect(rows[0].participacao).toBe(50);
  });

  it('sem vínculo recuperável, participação fica null (não inventa)', () => {
    const rows = buildHistoryRows([mkDss({ local_dss_id: 'l9' })], []);
    expect(rows[0].totalVinculado).toBeNull();
    expect(rows[0].participacao).toBeNull();
  });
});

describe('buildDssMonthlyEvolution', () => {
  it('retorna 12 pontos terminando na competência informada', () => {
    const evo = buildDssMonthlyEvolution([], [], '2026-05', 12);
    expect(evo).toHaveLength(12);
    expect(evo[11].competencia).toBe('2026-05');
  });

  it('conta quantidade de DSS e soma presentes/ausentes do mês', () => {
    const funcionarios = [mkFuncionario({ id: 'f1', local_dss_id: 'l1', ativo: true }), mkFuncionario({ id: 'f2', local_dss_id: 'l1', ativo: true })];
    const dss = [mkDss({ local_dss_id: 'l1', data_realizacao: '2026-05-05', participantes_ids: ['f1'] })];
    const evo = buildDssMonthlyEvolution(dss, funcionarios, '2026-05', 1);
    expect(evo[0].quantidade).toBe(1);
    expect(evo[0].presentes).toBe(1);
    expect(evo[0].ausentes).toBe(1); // 2 vinculados - 1 presente
  });
});

describe('computeLowParticipation', () => {
  it('calcula taxa = presenças ÷ DSS vinculados, ordenado ascendente', () => {
    const funcionarios = [mkFuncionario({ id: 'f1', local_dss_id: 'l1', ativo: true, data_admissao: '2026-01-01' })];
    const dss = [
      mkDss({ local_dss_id: 'l1', data_realizacao: '2026-02-01', participantes_ids: ['f1'] }),
      mkDss({ local_dss_id: 'l1', data_realizacao: '2026-03-01', participantes_ids: [] }),
    ];
    const rows = computeLowParticipation(dss, funcionarios);
    expect(rows[0]).toMatchObject({ funcionarioId: 'f1', dssEsperados: 2, presencas: 1, taxa: 50 });
  });

  it('exclui DSS anteriores à admissão do funcionário', () => {
    const funcionarios = [mkFuncionario({ id: 'f1', local_dss_id: 'l1', ativo: true, data_admissao: '2026-03-01' })];
    const dss = [
      mkDss({ local_dss_id: 'l1', data_realizacao: '2026-01-01', participantes_ids: [] }), // antes da admissão — ignorado
      mkDss({ local_dss_id: 'l1', data_realizacao: '2026-04-01', participantes_ids: ['f1'] }),
    ];
    const rows = computeLowParticipation(dss, funcionarios);
    expect(rows[0].dssEsperados).toBe(1);
    expect(rows[0].taxa).toBe(100);
  });

  it('funcionário sem nenhum DSS vinculado não aparece na lista', () => {
    const funcionarios = [mkFuncionario({ id: 'f1', local_dss_id: 'l1', ativo: true })];
    expect(computeLowParticipation([], funcionarios)).toEqual([]);
  });
});

describe('computeTemaDistribution', () => {
  it('agrupa por título e ordena por quantidade desc', () => {
    const dss = [mkDss({ titulo: 'EPI' }), mkDss({ titulo: 'EPI' }), mkDss({ titulo: 'Incêndio' })];
    const dist = computeTemaDistribution(dss);
    expect(dist[0]).toEqual({ tema: 'EPI', quantidade: 2 });
  });
});

describe('computeLocaisAbaixoReferencia', () => {
  it('filtra locais com participação abaixo do threshold', () => {
    const funcionarios = [mkFuncionario({ id: 'f1', local_dss_id: 'l1', ativo: true }), mkFuncionario({ id: 'f2', local_dss_id: 'l1', ativo: true })];
    const dss = [mkDss({ local_dss_id: 'l1', data_realizacao: '2026-05-01', participantes_ids: ['f1'] })];
    const abaixo = computeLocaisAbaixoReferencia(dss, funcionarios, '2026-05', 90);
    expect(abaixo).toEqual([{ localId: 'l1', participacao: 50 }]);
  });
});
