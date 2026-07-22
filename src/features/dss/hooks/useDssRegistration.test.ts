import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDssRegistration } from './useDssRegistration';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { DSS } from '@/hooks/useDSS';

const mkFuncionario = (id: string, localId: string): Funcionario => ({
  id, nome: `Func ${id}`, ativo: true, local_dss_id: localId, created_at: '', updated_at: '',
} as Funcionario);

function setup(funcionarios: Funcionario[] = [], create = vi.fn().mockResolvedValue({ id: 'novo1' }), update = vi.fn().mockResolvedValue({ id: 'e1' })) {
  return renderHook(() => useDssRegistration({ funcionarios, createDSS: create, updateDSS: update }));
}

describe('useDssRegistration', () => {
  it('etapa 1 não avança sem local/data/tema válidos', () => {
    const { result } = setup();
    act(() => result.current.goNext());
    expect(result.current.step).toBe(0);
    expect(result.current.stepErrors.localDssId).toBeTruthy();
  });

  it('avança de etapa quando os campos obrigatórios estão preenchidos', () => {
    const { result } = setup();
    act(() => result.current.patch({ localDssId: 'l1', dataRealizacao: '2026-05-10', tema: 'EPI' }));
    act(() => result.current.goNext());
    expect(result.current.step).toBe(1);
  });

  it('abrir edição NÃO marca dirty imediatamente (regressão corrigida)', () => {
    const dss: DSS = { id: 'e1', titulo: 'Tema X', data_realizacao: '2026-05-10', local_dss_id: 'l1', participantes_ids: ['f1'], created_at: '', updated_at: '' };
    const { result } = setup([mkFuncionario('f1', 'l1')]);
    act(() => result.current.startEdit(dss));
    expect(result.current.isDirty).toBe(false);
    expect(result.current.data.tema).toBe('Tema X');
  });

  it('editar um campo em modo de edição marca dirty', () => {
    const dss: DSS = { id: 'e1', titulo: 'Tema X', data_realizacao: '2026-05-10', local_dss_id: 'l1', participantes_ids: [], created_at: '', updated_at: '' };
    const { result } = setup([mkFuncionario('f1', 'l1')]);
    act(() => result.current.startEdit(dss));
    act(() => result.current.patch({ tema: 'Tema Y' }));
    expect(result.current.isDirty).toBe(true);
  });

  it('salvamento com sucesso envia o payload no formato esperado pela API atual', async () => {
    const create = vi.fn().mockResolvedValue({ id: 'novo1' });
    const { result } = setup([mkFuncionario('f1', 'l1')], create);
    act(() => result.current.patch({ localDssId: 'l1', dataRealizacao: '2026-05-10', tema: 'EPI' }));
    let ok = false;
    await act(async () => { ok = await result.current.submit(); });
    expect(ok).toBe(true);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      titulo: 'EPI',
      descricao: 'DSS realizado sobre: EPI',
      data_realizacao: '2026-05-10',
      local_dss_id: 'l1',
      participantes_ids: ['f1'],
      topics: ['EPI'],
      observacoes: '1 funcionários presentes',
    }));
  });

  it('erro no salvamento preserva os dados preenchidos (nada é limpo silenciosamente)', async () => {
    const create = vi.fn().mockResolvedValue(null);
    const { result } = setup([mkFuncionario('f1', 'l1')], create);
    act(() => result.current.patch({ localDssId: 'l1', dataRealizacao: '2026-05-10', tema: 'EPI' }));
    let ok = true;
    await act(async () => { ok = await result.current.submit(); });
    expect(ok).toBe(false);
    expect(result.current.data.tema).toBe('EPI'); // preservado
    expect(result.current.saveError).toBeTruthy();
  });
});
