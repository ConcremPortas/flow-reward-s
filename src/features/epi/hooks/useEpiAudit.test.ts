import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEpiAudit } from './useEpiAudit';
import { groupEpiRecords } from '../domain/epiCalculations';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { EPI } from '@/hooks/useEPI';

const mk = (id: string, nome: string): Funcionario => ({ id, nome, status: 'ativo', ativo: true, created_at: '', updated_at: '' } as Funcionario);

describe('useEpiAudit', () => {
  it('exige data da auditoria antes de avançar da etapa 0', async () => {
    const funcionarios = [mk('f1', 'Ana')];
    const saveAuditoria = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useEpiAudit({ funcionarios, saveAuditoria }));
    await waitFor(() => expect(result.current.inspection.conformes).toHaveLength(1));

    act(() => result.current.goNext());
    expect(result.current.step).toBe(0);
    expect(result.current.stepErrors.dataAuditoria).toBeTruthy();
  });

  it('salva 1 linha por funcionário auditado + 1 resumo, todas com a mesma auditoria_id', async () => {
    const funcionarios = [mk('f1', 'Ana'), mk('f2', 'Bruno')];
    let savedRows: any[] = [];
    const saveAuditoria = vi.fn().mockImplementation(async (rows) => { savedRows = rows; return true; });
    const { result } = renderHook(() => useEpiAudit({ funcionarios, saveAuditoria }));
    await waitFor(() => expect(result.current.inspection.conformes).toHaveLength(2));

    act(() => result.current.patch({ dataAuditoria: '2026-07-14' }));
    act(() => result.current.inspection.setCompliance('f2', false));
    await act(async () => { await result.current.submit(); });

    expect(savedRows).toHaveLength(3); // 2 funcionários + 1 resumo
    const tags = savedRows.map((r) => JSON.parse(r.observacoes).auditoria_id);
    expect(new Set(tags).size).toBe(1); // mesma auditoria_id em todas as linhas

    const summary = savedRows.find((r) => r.funcionario_id === null);
    expect(summary.status).toBe('nao_conforme'); // Bruno não conforme → resumo geral não conforme

    const bruno = savedRows.find((r) => r.funcionario_id === 'f2');
    expect(bruno.status).toBe('nao_conforme');
  });

  it('reseta o formulário após salvar com sucesso', async () => {
    const funcionarios = [mk('f1', 'Ana')];
    const saveAuditoria = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useEpiAudit({ funcionarios, saveAuditoria }));
    await waitFor(() => expect(result.current.inspection.conformes).toHaveLength(1));

    act(() => result.current.patch({ dataAuditoria: '2026-07-14' }));
    await act(async () => { await result.current.submit(); });

    expect(result.current.data.dataAuditoria).toBe('');
    expect(result.current.isEditing).toBe(false);
  });

  it('preserva os dados em caso de erro no salvamento', async () => {
    const funcionarios = [mk('f1', 'Ana')];
    const saveAuditoria = vi.fn().mockResolvedValue(false);
    const { result } = renderHook(() => useEpiAudit({ funcionarios, saveAuditoria }));
    await waitFor(() => expect(result.current.inspection.conformes).toHaveLength(1));

    act(() => result.current.patch({ dataAuditoria: '2026-07-14' }));
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.submit(); });

    expect(ok).toBe(false);
    expect(result.current.saveError).toBeTruthy();
    expect(result.current.data.dataAuditoria).toBe('2026-07-14'); // não foi limpo
  });

  it('editar: recupera estados por funcionario_id e não fica dirty imediatamente', async () => {
    const funcionarios = [mk('f1', 'Ana'), mk('f2', 'Bruno')];
    const records: EPI[] = [
      { id: 'd1', funcionario_id: 'f1', tipo_epi: 'Auditoria Geral de EPI', data_entrega: '2026-06-01', status: 'conforme', descricao: 'Auditoria de EPI — 01/06/2026', observacoes: '{"auditoria_id":"abc"}', created_at: '', updated_at: '' },
      { id: 'd2', funcionario_id: 'f2', tipo_epi: 'Auditoria Geral de EPI', data_entrega: '2026-06-01', status: 'nao_conforme', descricao: 'Auditoria de EPI — 01/06/2026', observacoes: '{"auditoria_id":"abc"}', created_at: '', updated_at: '' },
      { id: 'sum', tipo_epi: 'Auditoria Geral de EPI', data_entrega: '2026-06-01', status: 'nao_conforme', descricao: 'Auditoria de EPI — 01/06/2026', observacoes: '{"auditoria_id":"abc","resumo":true}', created_at: '', updated_at: '' },
    ];
    const funcionariosById = new Map(funcionarios.map((f) => [f.id, f]));
    const [group] = groupEpiRecords(records, funcionariosById);

    const saveAuditoria = vi.fn().mockResolvedValue(true);
    const { result } = renderHook(() => useEpiAudit({ funcionarios, saveAuditoria }));
    await waitFor(() => expect(result.current.inspection.conformes).toHaveLength(2));

    act(() => result.current.startEdit(group));
    await waitFor(() => expect(result.current.data.dataAuditoria).toBe('2026-06-01'));
    expect(result.current.inspection.draft.f1).toBe(true);
    expect(result.current.inspection.draft.f2).toBe(false);
    expect(result.current.isDirty).toBe(false); // regressão: não marca dirty ao só abrir a edição
  });

  it('editar e salvar: reutiliza a mesma auditoria_id e apaga só as linhas substituídas', async () => {
    const funcionarios = [mk('f1', 'Ana'), mk('f2', 'Bruno')];
    const records: EPI[] = [
      { id: 'd1', funcionario_id: 'f1', tipo_epi: 'Auditoria Geral de EPI', data_entrega: '2026-06-01', status: 'conforme', descricao: 'x', observacoes: '{"auditoria_id":"abc"}', created_at: '', updated_at: '' },
      { id: 'd2', funcionario_id: 'f2', tipo_epi: 'Auditoria Geral de EPI', data_entrega: '2026-06-01', status: 'conforme', descricao: 'x', observacoes: '{"auditoria_id":"abc"}', created_at: '', updated_at: '' },
      { id: 'sum', tipo_epi: 'Auditoria Geral de EPI', data_entrega: '2026-06-01', status: 'conforme', descricao: 'x', observacoes: '{"auditoria_id":"abc","resumo":true}', created_at: '', updated_at: '' },
    ];
    const funcionariosById = new Map(funcionarios.map((f) => [f.id, f]));
    const [group] = groupEpiRecords(records, funcionariosById);

    let capturedDeleteIds: string[] = [];
    let capturedRows: any[] = [];
    const saveAuditoria = vi.fn().mockImplementation(async (rows, deleteIds) => {
      capturedRows = rows; capturedDeleteIds = deleteIds;
      return true;
    });
    const { result } = renderHook(() => useEpiAudit({ funcionarios, saveAuditoria }));
    await waitFor(() => expect(result.current.inspection.conformes).toHaveLength(2));

    act(() => result.current.startEdit(group));
    await waitFor(() => expect(result.current.data.dataAuditoria).toBe('2026-06-01'));
    act(() => result.current.inspection.setCompliance('f2', false));
    await act(async () => { await result.current.submit(); });

    expect(capturedDeleteIds.sort()).toEqual(['d1', 'd2', 'sum']);
    const tags = capturedRows.map((r: any) => JSON.parse(r.observacoes).auditoria_id);
    expect(new Set(tags)).toEqual(new Set(['abc'])); // reaproveita a auditoria_id original
  });

  it('não sobrescreve funcionário não exibido (desligado desde a auditoria original)', async () => {
    // f1 segue ativo; f2 foi desligado (não está mais em `funcionarios` elegíveis).
    const funcionariosOriginais = [mk('f1', 'Ana'), mk('f2', 'Bruno')];
    const records: EPI[] = [
      { id: 'd1', funcionario_id: 'f1', tipo_epi: 'Auditoria Geral de EPI', data_entrega: '2026-06-01', status: 'conforme', descricao: 'x', observacoes: '{"auditoria_id":"abc"}', created_at: '', updated_at: '' },
      { id: 'd2', funcionario_id: 'f2', tipo_epi: 'Auditoria Geral de EPI', data_entrega: '2026-06-01', status: 'nao_conforme', descricao: 'x', observacoes: '{"auditoria_id":"abc"}', created_at: '', updated_at: '' },
      { id: 'sum', tipo_epi: 'Auditoria Geral de EPI', data_entrega: '2026-06-01', status: 'nao_conforme', descricao: 'x', observacoes: '{"auditoria_id":"abc","resumo":true}', created_at: '', updated_at: '' },
    ];
    const funcionariosById = new Map(funcionariosOriginais.map((f) => [f.id, f]));
    const [group] = groupEpiRecords(records, funcionariosById);

    const funcionariosAtuais = [mk('f1', 'Ana')]; // f2 não aparece mais (desligado)
    let capturedDeleteIds: string[] = [];
    const saveAuditoria = vi.fn().mockImplementation(async (_rows, deleteIds) => { capturedDeleteIds = deleteIds; return true; });
    const { result } = renderHook(() => useEpiAudit({ funcionarios: funcionariosAtuais, saveAuditoria }));
    await waitFor(() => expect(result.current.inspection.conformes).toHaveLength(1));

    act(() => result.current.startEdit(group));
    await waitFor(() => expect(result.current.data.dataAuditoria).toBe('2026-06-01'));
    await act(async () => { await result.current.submit(); });

    // d2 (Bruno, desligado) não deve ser apagado — só d1 (Ana, ainda exibida) e o resumo.
    expect(capturedDeleteIds.sort()).toEqual(['d1', 'sum']);
  });
});
