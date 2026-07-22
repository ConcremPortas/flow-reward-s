import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useProductionDraft } from './useProductionDraft';
import type { ProducaoSetor } from '@/hooks/useProducaoSetor';

const mkReg = (over: Partial<ProducaoSetor>): ProducaoSetor => ({
  id: over.id || 'r1', setor_id: over.setor_id || 's1', data_producao: over.data_producao || '2026-05-01',
  meta_diaria: over.meta_diaria ?? 1000, producao_realizada: over.producao_realizada ?? 900,
  unidade_medida: over.unidade_medida || 'unidades', created_at: '', updated_at: '', ...over,
});

describe('useProductionDraft', () => {
  it('carrega baseline da competência e não fica dirty', async () => {
    const registros = [mkReg({ id: 'r1', setor_id: 's1' })];
    const { result } = renderHook(() => useProductionDraft({
      competencia: '2026-05', registros, registrosLoading: false, saveApuracao: vi.fn(),
    }));
    await waitFor(() => expect(result.current.draft.s1).toEqual({ meta: 1000, realizado: 900 }));
    expect(result.current.isDirty).toBe(false);
  });

  it('editar realizado marca dirty; restaurar limpa', async () => {
    const registros = [mkReg({ id: 'r1', setor_id: 's1' })];
    const { result } = renderHook(() => useProductionDraft({
      competencia: '2026-05', registros, registrosLoading: false, saveApuracao: vi.fn(),
    }));
    await waitFor(() => expect(result.current.draft.s1).toBeDefined());
    act(() => result.current.setField('s1', 'realizado', '950'));
    expect(result.current.isDirty).toBe(true);
    expect(result.current.diff.realizadosAlterados).toBe(1);
    act(() => result.current.restoreAll());
    expect(result.current.isDirty).toBe(false);
  });

  it('save separa UPDATE (setor com registro) de INSERT (setor pendente)', async () => {
    const registros = [mkReg({ id: 'r1', setor_id: 's1', meta_diaria: 1000, producao_realizada: 900 })];
    const saveApuracao = vi.fn().mockResolvedValue({ ok: true, updated: 1, inserted: 1, failedSetorIds: [] });
    const { result } = renderHook(() => useProductionDraft({
      competencia: '2026-05', registros, registrosLoading: false, saveApuracao,
    }));
    await waitFor(() => expect(result.current.draft.s1).toBeDefined());

    act(() => result.current.setField('s1', 'realizado', '1200')); // update
    act(() => { result.current.setField('s2', 'meta', '500'); });   // insert (pendente)
    act(() => { result.current.setField('s2', 'realizado', '480'); });

    await act(async () => { await result.current.save(() => 'unidades'); });

    const arg = saveApuracao.mock.calls[0][0];
    expect(arg.updates).toEqual([{ id: 'r1', meta_diaria: 1000, producao_realizada: 1200 }]);
    expect(arg.inserts).toEqual([{
      setor_id: 's2', data_producao: '2026-05-01', meta_diaria: 500, producao_realizada: 480, unidade_medida: 'unidades',
    }]);
    expect(result.current.isDirty).toBe(false); // baseline atualizado após sucesso
  });

  it('falha parcial mantém alterações (isDirty permanece)', async () => {
    const registros = [mkReg({ id: 'r1', setor_id: 's1' })];
    const saveApuracao = vi.fn().mockResolvedValue({ ok: false, updated: 0, inserted: 0, failedSetorIds: ['r1'] });
    const { result } = renderHook(() => useProductionDraft({
      competencia: '2026-05', registros, registrosLoading: false, saveApuracao,
    }));
    await waitFor(() => expect(result.current.draft.s1).toBeDefined());
    act(() => result.current.setField('s1', 'realizado', '111'));
    let ok: boolean | undefined;
    await act(async () => { ok = await result.current.save(() => 'unidades'); });
    expect(ok).toBe(false);
    expect(result.current.isDirty).toBe(true);
    expect(result.current.error).toBeTruthy();
  });
});
