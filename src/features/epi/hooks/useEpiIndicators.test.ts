import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEpiIndicators } from './useEpiIndicators';
import { groupEpiRecords } from '../domain/epiCalculations';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { EPI } from '@/hooks/useEPI';

const mkFuncionario = (id: string, nome: string, setorId: string): Funcionario =>
  ({ id, nome, setor_id: setorId, empresa_id: 'e1', setor: { nome: `Setor ${setorId}` }, ativo: true, created_at: '', updated_at: '' } as Funcionario);

const mkEpi = (over: Partial<EPI>): EPI => ({
  id: over.id || 'r1', tipo_epi: 'Auditoria Geral de EPI', data_entrega: '2026-07-01',
  created_at: '2026-07-01T10:00:00Z', updated_at: '2026-07-01T10:00:00Z', ...over,
});

describe('useEpiIndicators', () => {
  it('calcula auditorias realizadas, taxa de conformidade e não conformidades na competência', () => {
    const funcionariosById = new Map([['f1', mkFuncionario('f1', 'Ana', 's1')], ['f2', mkFuncionario('f2', 'Bruno', 's1')]]);
    const records = [
      mkEpi({ id: 'd1', funcionario_id: 'f1', status: 'conforme', data_entrega: '2026-07-05', observacoes: '{"auditoria_id":"jul"}' }),
      mkEpi({ id: 'd2', funcionario_id: 'f2', status: 'nao_conforme', data_entrega: '2026-07-05', observacoes: '{"auditoria_id":"jul"}' }),
    ];
    const groups = groupEpiRecords(records, funcionariosById);
    const setores = [{ id: 's1', nome: 'Produção' }];

    const { result } = renderHook(() => useEpiIndicators(groups, funcionariosById, setores));
    act(() => result.current.setCompetencia('2026-07'));

    expect(result.current.auditoriasRealizadas).toBe(1);
    expect(result.current.auditados).toBe(2);
    expect(result.current.taxaConformidade).toBe(50);
    expect(result.current.naoConformes).toBe(1);
  });

  it('sem auditorias no período: indicadores neutros e insight de período vazio', () => {
    const { result } = renderHook(() => useEpiIndicators([], new Map(), []));
    act(() => result.current.setCompetencia('2026-07'));

    expect(result.current.auditoriasRealizadas).toBe(0);
    expect(result.current.taxaConformidade).toBeNull();
    expect(result.current.insights).toEqual(['Nenhuma auditoria de EPI foi realizada neste período.']);
  });

  it('evolução de 12 meses tem 12 pontos terminando na competência selecionada', () => {
    const funcionariosById = new Map([['f1', mkFuncionario('f1', 'Ana', 's1')]]);
    const records = [mkEpi({ id: 'd1', funcionario_id: 'f1', status: 'conforme', data_entrega: '2026-07-05', observacoes: '{"auditoria_id":"jul"}' })];
    const groups = groupEpiRecords(records, funcionariosById);

    const { result } = renderHook(() => useEpiIndicators(groups, funcionariosById, []));
    act(() => result.current.setCompetencia('2026-07'));

    expect(result.current.evolucao12Meses).toHaveLength(12);
    expect(result.current.evolucao12Meses[11].competencia).toBe('2026-07');
    expect(result.current.evolucao12Meses[11].auditorias).toBe(1);
  });
});
