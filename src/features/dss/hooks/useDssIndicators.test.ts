import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDssIndicators } from './useDssIndicators';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { DSS } from '@/hooks/useDSS';

const mkFuncionario = (id: string, localId: string): Funcionario => ({
  id, nome: `Func ${id}`, ativo: true, local_dss_id: localId, created_at: '', updated_at: '',
} as Funcionario);

const mkDss = (id: string, localId: string, data: string, presentes: string[]): DSS => ({
  id, titulo: `Tema ${id}`, data_realizacao: data, local_dss_id: localId,
  participantes_ids: presentes, created_at: '', updated_at: '',
});

describe('useDssIndicators', () => {
  it('calcula DSS realizados, participação média e total de participações na competência', () => {
    const funcionarios = [mkFuncionario('f1', 'l1'), mkFuncionario('f2', 'l1')];
    const dssRecords = [mkDss('d1', 'l1', '2026-07-05', ['f1', 'f2'])];

    const { result } = renderHook(() => useDssIndicators(dssRecords, funcionarios));
    act(() => result.current.setCompetencia('2026-07'));

    expect(result.current.dssRealizados).toBe(1);
    expect(result.current.participacaoMedia).toBe(100);
    expect(result.current.totalParticipacoes).toBe(2);
  });

  it('identifica pessoas abaixo da meta (taxa < 70%) somente entre vinculados ativos', () => {
    const funcionarios = [mkFuncionario('f1', 'l1'), mkFuncionario('f2', 'l1')];
    const dssRecords = [
      mkDss('d1', 'l1', '2026-06-01', ['f1']),
      mkDss('d2', 'l1', '2026-06-08', ['f1']),
      mkDss('d3', 'l1', '2026-06-15', ['f1']),
    ];

    const { result } = renderHook(() => useDssIndicators(dssRecords, funcionarios));
    act(() => result.current.setCompetencia('2026-06'));

    expect(result.current.pessoasAbaixoMeta).toBe(1);
    expect(result.current.baixaParticipacaoLista[0].funcionarioId).toBe('f2');
    expect(result.current.baixaParticipacaoLista[0].taxa).toBe(0);
  });

  it('sem DSS no período: indicadores neutros e listas vazias', () => {
    const funcionarios = [mkFuncionario('f1', 'l1')];
    const { result } = renderHook(() => useDssIndicators([], funcionarios));
    act(() => result.current.setCompetencia('2026-07'));

    expect(result.current.dssRealizados).toBe(0);
    expect(result.current.participacaoMedia).toBeNull();
    expect(result.current.variacaoParticipacoes).toBe(0);
    expect(result.current.distribuicaoTemas).toEqual([]);
  });

  it('evolução de 12 meses termina na competência selecionada e tem 12 pontos', () => {
    const funcionarios = [mkFuncionario('f1', 'l1')];
    const dssRecords = [mkDss('d1', 'l1', '2026-07-05', ['f1'])];

    const { result } = renderHook(() => useDssIndicators(dssRecords, funcionarios));
    act(() => result.current.setCompetencia('2026-07'));

    expect(result.current.evolucao12Meses).toHaveLength(12);
    expect(result.current.evolucao12Meses[11].competencia).toBe('2026-07');
    expect(result.current.evolucao12Meses[11].quantidade).toBe(1);
  });
});
