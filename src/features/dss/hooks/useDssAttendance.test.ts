import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useDssAttendance } from './useDssAttendance';
import type { Funcionario } from '@/hooks/useFuncionarios';

const mkFuncionario = (id: string, localId: string): Funcionario => ({
  id, nome: `Func ${id}`, ativo: true, local_dss_id: localId, created_at: '', updated_at: '',
} as Funcionario);

describe('useDssAttendance', () => {
  it('novo DSS: todos os vinculados começam presentes (comportamento original preservado)', async () => {
    const funcionarios = [mkFuncionario('f1', 'l1'), mkFuncionario('f2', 'l1')];
    const { result } = renderHook(() => useDssAttendance({ localDssId: 'l1', funcionarios }));
    await waitFor(() => expect(result.current.vinculados).toHaveLength(2));
    expect(result.current.draft.f1).toBe(true);
    expect(result.current.draft.f2).toBe(true);
    expect(result.current.participacaoPct).toBe(100);
  });

  it('edição: apenas os IDs de participantes_ids começam presentes', async () => {
    const funcionarios = [mkFuncionario('f1', 'l1'), mkFuncionario('f2', 'l1')];
    const { result } = renderHook(() => useDssAttendance({ localDssId: 'l1', funcionarios, initialParticipantIds: ['f1'] }));
    await waitFor(() => expect(result.current.vinculados).toHaveLength(2));
    expect(result.current.draft.f1).toBe(true);
    expect(result.current.draft.f2).toBe(false);
  });

  it('marcar presença individual atualiza contadores e percentual', async () => {
    const funcionarios = [mkFuncionario('f1', 'l1'), mkFuncionario('f2', 'l1')];
    const { result } = renderHook(() => useDssAttendance({ localDssId: 'l1', funcionarios }));
    await waitFor(() => expect(result.current.vinculados).toHaveLength(2));
    act(() => result.current.setPresence('f1', false));
    expect(result.current.presentes).toHaveLength(1);
    expect(result.current.ausentes).toHaveLength(1);
    expect(result.current.participacaoPct).toBe(50);
    expect(result.current.isDirty).toBe(true);
  });

  it('marcar todos ausentes e todos presentes', async () => {
    const funcionarios = [mkFuncionario('f1', 'l1'), mkFuncionario('f2', 'l1')];
    const { result } = renderHook(() => useDssAttendance({ localDssId: 'l1', funcionarios }));
    await waitFor(() => expect(result.current.vinculados).toHaveLength(2));
    act(() => result.current.markAllAbsent());
    expect(result.current.presentes).toHaveLength(0);
    act(() => result.current.markAllPresent());
    expect(result.current.presentes).toHaveLength(2);
  });

  it('restaurar volta à marcação inicial e zera o dirty', async () => {
    const funcionarios = [mkFuncionario('f1', 'l1')];
    const { result } = renderHook(() => useDssAttendance({ localDssId: 'l1', funcionarios, initialParticipantIds: ['f1'] }));
    await waitFor(() => expect(result.current.vinculados).toHaveLength(1));
    act(() => result.current.setPresence('f1', false));
    expect(result.current.isDirty).toBe(true);
    act(() => result.current.restoreInitial());
    expect(result.current.isDirty).toBe(false);
    expect(result.current.draft.f1).toBe(true);
  });

  it('funcionário sem vínculo ao local não entra na lista de presença', async () => {
    const funcionarios = [mkFuncionario('f1', 'l1'), mkFuncionario('f2', 'l2')];
    const { result } = renderHook(() => useDssAttendance({ localDssId: 'l1', funcionarios }));
    await waitFor(() => expect(result.current.vinculados).toHaveLength(1));
    expect(result.current.vinculados.map((f) => f.id)).toEqual(['f1']);
  });
});
