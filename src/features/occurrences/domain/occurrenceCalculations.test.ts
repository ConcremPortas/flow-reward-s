import { describe, it, expect } from 'vitest';
import { computePeriodTotals, aggregateBySetor, computeConcentracao, computeImpactoPremiacao, inCompetencia, buildMonthlyEvolution, buildHistoryRows } from './occurrenceCalculations';

const REG = (funcionario_id: string, tipo: string, quantidade: number, data: string) => ({ funcionario_id, tipo, quantidade, data_ocorrencia: data });

describe('inCompetencia', () => {
  it('compara apenas ano-mês', () => {
    expect(inCompetencia('2026-05-01', '2026-05')).toBe(true);
    expect(inCompetencia('2026-04-30', '2026-05')).toBe(false);
  });
});

describe('computePeriodTotals', () => {
  const registros = [
    REG('f1', 'falta', 2, '2026-05-01'),
    REG('f1', 'advertencia', 1, '2026-05-01'),
    REG('f2', 'falta', 1, '2026-05-01'),
    REG('f3', 'falta', 3, '2026-04-01'), // fora do período
  ];

  it('soma faltas/advertências apenas da competência informada', () => {
    const t = computePeriodTotals(registros, '2026-05');
    expect(t.totalFaltas).toBe(3);
    expect(t.totalAdvertencias).toBe(1);
    expect(t.pessoasComOcorrencia).toBe(2);
  });

  it('competência sem registros retorna zeros', () => {
    const t = computePeriodTotals(registros, '2099-01');
    expect(t).toEqual({ totalFaltas: 0, totalAdvertencias: 0, pessoasComOcorrencia: 0 });
  });
});

describe('aggregateBySetor', () => {
  it('agrupa e ordena por total de ocorrências (desc)', () => {
    const registros = [
      REG('f1', 'falta', 5, '2026-05-01'),
      REG('f2', 'falta', 1, '2026-05-01'),
    ];
    const setorMap = new Map([['f1', 'Produção'], ['f2', 'Expedição']]);
    const agg = aggregateBySetor(registros, '2026-05', setorMap);
    expect(agg[0].setor).toBe('Produção');
    expect(agg[0].faltas).toBe(5);
  });

  it('funcionário sem setor mapeado vira "Sem setor"', () => {
    const registros = [REG('f9', 'falta', 1, '2026-05-01')];
    const agg = aggregateBySetor(registros, '2026-05', new Map());
    expect(agg[0].setor).toBe('Sem setor');
  });
});

describe('computeConcentracao', () => {
  it('rankeia funcionários com mais ocorrências', () => {
    const registros = [
      REG('f1', 'falta', 4, '2026-05-01'),
      REG('f1', 'advertencia', 1, '2026-05-01'),
      REG('f2', 'falta', 1, '2026-05-01'),
    ];
    const top = computeConcentracao(registros, '2026-05', 5);
    expect(top[0]).toEqual({ funcionarioId: 'f1', total: 5 });
  });
});

describe('buildMonthlyEvolution', () => {
  it('retorna 12 pontos terminando na competência informada, na ordem cronológica', () => {
    const evo = buildMonthlyEvolution([], '2026-05', 12);
    expect(evo).toHaveLength(12);
    expect(evo[11].competencia).toBe('2026-05');
    expect(evo[0].competencia).toBe('2025-06');
  });

  it('preenche os totais de cada mês a partir dos registros', () => {
    const registros = [REG('f1', 'falta', 2, '2026-05-01'), REG('f1', 'advertencia', 1, '2026-04-01')];
    const evo = buildMonthlyEvolution(registros, '2026-05', 3);
    const mai = evo.find((p) => p.competencia === '2026-05')!;
    const abr = evo.find((p) => p.competencia === '2026-04')!;
    expect(mai.totalFaltas).toBe(2);
    expect(abr.totalAdvertencias).toBe(1);
  });
});

describe('buildHistoryRows', () => {
  const funcionarios = [{ id: 'f1', nome: 'João Silva', cod: '0001', setor: 'Produção' }];

  it('gera uma linha por funcionário/competência dentro do intervalo', () => {
    const registros = [REG('f1', 'falta', 2, '2026-05-01')];
    const rows = buildHistoryRows(registros, funcionarios, '2026-01', '2026-05');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ funcionarioId: 'f1', competencia: '2026-05', faltas: 2, total: 2 });
  });

  it('calcula a variação em relação à competência anterior do mesmo funcionário', () => {
    const registros = [REG('f1', 'falta', 1, '2026-04-01'), REG('f1', 'falta', 4, '2026-05-01')];
    const rows = buildHistoryRows(registros, funcionarios, '2026-04', '2026-05');
    const mai = rows.find((r) => r.competencia === '2026-05')!;
    expect(mai.variacao).toBe(3); // 4 - 1
  });

  it('variação é null quando não há competência anterior para comparar', () => {
    const registros = [REG('f1', 'falta', 2, '2026-05-01')];
    const rows = buildHistoryRows(registros, funcionarios, '2026-05', '2026-05');
    expect(rows[0].variacao).toBeNull();
  });

  it('ignora competências fora do intervalo filtrado', () => {
    const registros = [REG('f1', 'falta', 2, '2026-01-01')];
    const rows = buildHistoryRows(registros, funcionarios, '2026-05', '2026-06');
    expect(rows).toHaveLength(0);
  });

  it('ignora funcionário não encontrado no lookup', () => {
    const registros = [REG('f9', 'falta', 2, '2026-05-01')];
    const rows = buildHistoryRows(registros, funcionarios, '2026-05', '2026-05');
    expect(rows).toHaveLength(0);
  });
});

describe('computeImpactoPremiacao (reuso do motor de premiação)', () => {
  it('4 ou mais ocorrências zera a nota (regra real do motor)', () => {
    expect(computeImpactoPremiacao(4, 4).notaFaltas).toBe(0);
    expect(computeImpactoPremiacao(4, 4).notaAdvertencias).toBe(0);
  });
  it('0 ocorrências mantém nota máxima', () => {
    expect(computeImpactoPremiacao(0, 0).notaFaltas).toBe(1.0);
    expect(computeImpactoPremiacao(0, 0).notaAdvertencias).toBe(1.0);
  });
});
