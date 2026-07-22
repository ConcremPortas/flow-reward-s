import { describe, it, expect } from 'vitest';
import {
  parseAuditoriaTag, parseLegacyMembers, groupEpiRecords, buildEpiMonthlyEvolution, buildSectorComparison, computeEpiInsights,
  computeNonConformitySummary,
} from './epiCalculations';
import type { EPI } from '@/hooks/useEPI';
import type { Funcionario } from '@/hooks/useFuncionarios';

const mkFuncionario = (id: string, nome: string, setorId: string, empresaId = 'e1'): Funcionario =>
  ({ id, nome, setor_id: setorId, empresa_id: empresaId, setor: { nome: `Setor ${setorId}` }, ativo: true, created_at: '', updated_at: '' } as Funcionario);

const mkEpi = (over: Partial<EPI>): EPI => ({
  id: over.id || 'r1',
  tipo_epi: 'Auditoria Geral de EPI',
  data_entrega: '2026-07-01',
  created_at: '2026-07-01T10:00:00Z',
  updated_at: '2026-07-01T10:00:00Z',
  ...over,
});

describe('parseAuditoriaTag', () => {
  it('extrai auditoria_id do formato novo', () => {
    expect(parseAuditoriaTag('{"auditoria_id":"abc"}')).toEqual({ auditoriaId: 'abc', isSummary: false });
  });
  it('marca isSummary quando presente', () => {
    expect(parseAuditoriaTag('{"auditoria_id":"abc","resumo":true}')).toEqual({ auditoriaId: 'abc', isSummary: true });
  });
  it('texto livre legado (não-JSON) → null', () => {
    expect(parseAuditoriaTag('Resumo: 1 conforme\n\nDetalhes:\nJoão: Conforme')).toBeNull();
  });
  it('null/undefined/vazio → null', () => {
    expect(parseAuditoriaTag(null)).toBeNull();
    expect(parseAuditoriaTag(undefined)).toBeNull();
    expect(parseAuditoriaTag('')).toBeNull();
  });
  it('JSON sem auditoria_id → null', () => {
    expect(parseAuditoriaTag('{"foo":"bar"}')).toBeNull();
  });
});

describe('parseLegacyMembers', () => {
  it('recupera pares nome/situação do texto livre', () => {
    const texto = 'Resumo: 1 conformes, 1 não conformes\n\nDetalhes:\nJoão Silva: Conforme\nMaria Souza: Não conforme';
    expect(parseLegacyMembers(texto)).toEqual([
      { funcionarioId: null, nome: 'João Silva', conforme: true, recordId: null },
      { funcionarioId: null, nome: 'Maria Souza', conforme: false, recordId: null },
    ]);
  });
  it('texto vazio ou nulo → lista vazia', () => {
    expect(parseLegacyMembers('')).toEqual([]);
    expect(parseLegacyMembers(null)).toEqual([]);
  });
});

describe('groupEpiRecords — formato novo', () => {
  const funcionariosById = new Map([
    ['f1', mkFuncionario('f1', 'Ana', 's1')],
    ['f2', mkFuncionario('f2', 'Bruno', 's1')],
  ]);

  it('agrupa linhas por funcionário + resumo em uma única auditoria', () => {
    const records: EPI[] = [
      mkEpi({ id: 'd1', funcionario_id: 'f1', status: 'conforme', observacoes: '{"auditoria_id":"abc"}', descricao: 'Auditoria de EPI — 01/07/2026' }),
      mkEpi({ id: 'd2', funcionario_id: 'f2', status: 'nao_conforme', observacoes: '{"auditoria_id":"abc"}', descricao: 'Auditoria de EPI — 01/07/2026' }),
      mkEpi({ id: 'sum', funcionario_id: undefined, status: 'nao_conforme', observacoes: '{"auditoria_id":"abc","resumo":true}', descricao: 'Auditoria de EPI — 01/07/2026' }),
    ];

    const groups = groupEpiRecords(records, funcionariosById);
    expect(groups).toHaveLength(1);
    const g = groups[0];
    expect(g.isLegacy).toBe(false);
    expect(g.totalAuditados).toBe(2);
    expect(g.conformes).toBe(1);
    expect(g.naoConformes).toBe(1);
    expect(g.taxaConformidade).toBe(50);
    expect(g.summaryRecordId).toBe('sum');
    expect(g.memberRecordIds.sort()).toEqual(['d1', 'd2', 'sum']);
  });

  it('funcionário sem correspondência no mapa aparece como removido', () => {
    const records: EPI[] = [
      mkEpi({ id: 'd1', funcionario_id: 'f9', status: 'conforme', observacoes: '{"auditoria_id":"xyz"}' }),
    ];
    const groups = groupEpiRecords(records, funcionariosById);
    expect(groups[0].membros[0].nome).toBe('(funcionário removido)');
  });
});

describe('groupEpiRecords — formato legado', () => {
  it('cada linha-resumo legada vira sua própria auditoria', () => {
    const records: EPI[] = [
      mkEpi({
        id: 'legacy1', funcionario_id: undefined, status: 'nao_conforme', data_entrega: '2026-06-01',
        descricao: 'Auditoria de EPI realizada em 01/06/2026',
        observacoes: 'Resumo: 1 conformes, 1 não conformes\n\nDetalhes:\nAna: Conforme\nBruno: Não conforme',
      }),
    ];
    const groups = groupEpiRecords(records, new Map());
    expect(groups).toHaveLength(1);
    expect(groups[0].isLegacy).toBe(true);
    expect(groups[0].totalAuditados).toBe(2);
    expect(groups[0].conformes).toBe(1);
    expect(groups[0].auditoriaId).toBe('legacy:legacy1');
  });
});

describe('groupEpiRecords — ordenação', () => {
  it('ordena por data decrescente', () => {
    const records: EPI[] = [
      mkEpi({ id: 'a', data_entrega: '2026-05-01', observacoes: '{"auditoria_id":"a"}' }),
      mkEpi({ id: 'b', data_entrega: '2026-07-01', observacoes: '{"auditoria_id":"b"}' }),
    ];
    const groups = groupEpiRecords(records, new Map());
    expect(groups.map((g) => g.data)).toEqual(['2026-07-01', '2026-05-01']);
  });
});

describe('buildEpiMonthlyEvolution', () => {
  it('agrega auditorias por competência ao longo de N meses', () => {
    const funcionariosById = new Map([['f1', mkFuncionario('f1', 'Ana', 's1')], ['f2', mkFuncionario('f2', 'Bruno', 's1')]]);
    const records: EPI[] = [
      mkEpi({ id: 'd1', funcionario_id: 'f1', status: 'conforme', data_entrega: '2026-07-05', observacoes: '{"auditoria_id":"jul"}' }),
      mkEpi({ id: 'd2', funcionario_id: 'f2', status: 'nao_conforme', data_entrega: '2026-07-05', observacoes: '{"auditoria_id":"jul"}' }),
    ];
    const groups = groupEpiRecords(records, funcionariosById);
    const evolucao = buildEpiMonthlyEvolution(groups, '2026-07', 12);
    expect(evolucao).toHaveLength(12);
    const julho = evolucao[11];
    expect(julho.competencia).toBe('2026-07');
    expect(julho.auditorias).toBe(1);
    expect(julho.auditados).toBe(2);
    expect(julho.taxaConformidade).toBe(50);
  });

  it('mês sem auditorias → taxa nula', () => {
    const evolucao = buildEpiMonthlyEvolution([], '2026-07', 1);
    expect(evolucao[0].taxaConformidade).toBeNull();
    expect(evolucao[0].auditorias).toBe(0);
  });
});

describe('buildSectorComparison', () => {
  it('calcula taxa por setor e tendência vs. mês anterior', () => {
    const funcionariosById = new Map([
      ['f1', mkFuncionario('f1', 'Ana', 's1')],
      ['f2', mkFuncionario('f2', 'Bruno', 's1')],
    ]);
    const records: EPI[] = [
      // mês atual: 1 conforme, 1 não conforme → 50%
      mkEpi({ id: 'd1', funcionario_id: 'f1', status: 'conforme', data_entrega: '2026-07-05', observacoes: '{"auditoria_id":"jul"}' }),
      mkEpi({ id: 'd2', funcionario_id: 'f2', status: 'nao_conforme', data_entrega: '2026-07-05', observacoes: '{"auditoria_id":"jul"}' }),
      // mês anterior: ambos conformes → 100%
      mkEpi({ id: 'd3', funcionario_id: 'f1', status: 'conforme', data_entrega: '2026-06-05', observacoes: '{"auditoria_id":"jun"}' }),
      mkEpi({ id: 'd4', funcionario_id: 'f2', status: 'conforme', data_entrega: '2026-06-05', observacoes: '{"auditoria_id":"jun"}' }),
    ];
    const groups = groupEpiRecords(records, funcionariosById);
    const setores = [{ id: 's1', nome: 'Produção' }, { id: 's2', nome: 'Manutenção' }];
    const result = buildSectorComparison(groups, funcionariosById, setores, '2026-07');

    expect(result).toHaveLength(1); // s2 sem auditados → fora
    expect(result[0].setorId).toBe('s1');
    expect(result[0].taxaConformidade).toBe(50);
    expect(result[0].tendencia).toBe('descendo');
  });
});

describe('computeEpiInsights', () => {
  it('sem auditorias no período → insight único', () => {
    const insights = computeEpiInsights({ auditoriasRealizadas: 0, taxaConformidade: null, variacaoTaxa: null, reincidentes: 0, setoresAbaixoReferencia: 0 });
    expect(insights).toEqual(['Nenhuma auditoria de EPI foi realizada neste período.']);
  });

  it('tudo dentro da referência → insight neutro', () => {
    const insights = computeEpiInsights({ auditoriasRealizadas: 1, taxaConformidade: 95, variacaoTaxa: 0, reincidentes: 0, setoresAbaixoReferencia: 0 });
    expect(insights).toEqual(['Conformidade dentro da referência, sem reincidências neste período.']);
  });

  it('sinaliza taxa baixa, queda, reincidência e setores abaixo da referência', () => {
    const insights = computeEpiInsights({ auditoriasRealizadas: 1, taxaConformidade: 60, variacaoTaxa: -10, reincidentes: 2, setoresAbaixoReferencia: 3 });
    expect(insights).toHaveLength(4);
    expect(insights[0]).toContain('abaixo de 80%');
    expect(insights[1]).toContain('Queda de 10%');
    expect(insights[2]).toContain('2 funcionário');
    expect(insights[3]).toContain('3 setor');
  });
});

describe('computeNonConformitySummary', () => {
  const mkGroup = (data: string, auditados: number, naoConformes: number) => ({
    auditoriaId: data, isLegacy: false, data, titulo: '', createdAt: '',
    totalAuditados: auditados, conformes: auditados - naoConformes, naoConformes, taxaConformidade: null,
    membros: [], summaryRecordId: null, memberRecordIds: [],
  });

  it('sem período informado: agrega tudo e não calcula variação', () => {
    const groups = [mkGroup('2026-07-01', 10, 2), mkGroup('2026-06-01', 10, 5)];
    const summary = computeNonConformitySummary(groups, '', '');
    expect(summary.auditados).toBe(20);
    expect(summary.naoConformes).toBe(7);
    expect(summary.variacao).toBeNull();
  });

  it('com período informado: calcula variação vs. janela anterior de mesma duração', () => {
    const groups = [
      mkGroup('2026-07-15', 10, 5), // dentro do período (taxa 50%)
      mkGroup('2026-06-15', 10, 1), // janela anterior de 30 dias (taxa 10%)
    ];
    const summary = computeNonConformitySummary(groups, '2026-07-01', '2026-07-31');
    expect(summary.taxaNaoConformidade).toBe(50);
    expect(summary.variacao).toBe(40); // 50% - 10%
  });

  it('sem auditorias no período: taxa nula', () => {
    const summary = computeNonConformitySummary([], '2026-07-01', '2026-07-31');
    expect(summary.taxaNaoConformidade).toBeNull();
    expect(summary.auditados).toBe(0);
  });
});
