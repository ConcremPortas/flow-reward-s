import { describe, it, expect } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useEpiInspection } from './useEpiInspection';
import type { Funcionario } from '@/hooks/useFuncionarios';

const mk = (id: string): Funcionario => ({ id, nome: `Func ${id}`, ativo: true, created_at: '', updated_at: '' } as Funcionario);

describe('useEpiInspection', () => {
  it('nova auditoria: todos começam conformes (regra preservada)', async () => {
    const funcionarios = [mk('f1'), mk('f2')];
    const { result } = renderHook(() => useEpiInspection({ funcionarios, seedKey: 'new-1' }));
    await waitFor(() => expect(result.current.conformes).toHaveLength(2));
    expect(result.current.draft.f1).toBe(true);
    expect(result.current.taxaConformidade).toBe(100);
  });

  it('edição: usa o mapa inicial informado', async () => {
    const funcionarios = [mk('f1'), mk('f2')];
    const { result } = renderHook(() =>
      useEpiInspection({ funcionarios, initialComplianceMap: { f1: false }, seedKey: 'edit-1' }));
    await waitFor(() => expect(result.current.naoConformes).toHaveLength(1));
    expect(result.current.draft.f1).toBe(false);
    expect(result.current.draft.f2).toBe(true);
  });

  it('marcar não conforme atualiza contadores e dirty', async () => {
    const funcionarios = [mk('f1'), mk('f2')];
    const { result } = renderHook(() => useEpiInspection({ funcionarios, seedKey: 'new-1' }));
    await waitFor(() => expect(result.current.conformes).toHaveLength(2));
    act(() => result.current.setCompliance('f1', false));
    expect(result.current.naoConformes).toHaveLength(1);
    expect(result.current.taxaConformidade).toBe(50);
    expect(result.current.isDirty).toBe(true);
  });

  it('marcar todos conformes restaura todos ao estado positivo', async () => {
    const funcionarios = [mk('f1'), mk('f2')];
    const { result } = renderHook(() => useEpiInspection({ funcionarios, seedKey: 'new-1' }));
    await waitFor(() => expect(result.current.conformes).toHaveLength(2));
    act(() => result.current.setCompliance('f1', false));
    act(() => result.current.markAllConforme());
    expect(result.current.conformes).toHaveLength(2);
  });

  it('restaurar volta ao estado inicial e zera o dirty', async () => {
    const funcionarios = [mk('f1')];
    const { result } = renderHook(() =>
      useEpiInspection({ funcionarios, initialComplianceMap: { f1: false }, seedKey: 'edit-1' }));
    await waitFor(() => expect(result.current.draft.f1).toBe(false));
    act(() => result.current.setCompliance('f1', true));
    expect(result.current.isDirty).toBe(true);
    act(() => result.current.restoreInitial());
    expect(result.current.isDirty).toBe(false);
    expect(result.current.draft.f1).toBe(false);
  });

  it('trocar seedKey força novo reseed mesmo com a mesma lista', async () => {
    const funcionarios = [mk('f1')];
    const { result, rerender } = renderHook(
      ({ seedKey, initial }: { seedKey: string; initial?: Record<string, boolean> }) =>
        useEpiInspection({ funcionarios, initialComplianceMap: initial, seedKey }),
      { initialProps: { seedKey: 'new-1', initial: undefined as Record<string, boolean> | undefined } },
    );
    await waitFor(() => expect(result.current.draft.f1).toBe(true));
    act(() => result.current.setCompliance('f1', false));
    rerender({ seedKey: 'edit-2', initial: { f1: true } });
    await waitFor(() => expect(result.current.draft.f1).toBe(true));
  });
});
