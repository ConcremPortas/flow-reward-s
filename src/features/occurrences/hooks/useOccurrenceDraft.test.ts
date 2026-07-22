import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useOccurrenceDraft } from './useOccurrenceDraft';
import type { FaltaAdvertencia } from '@/hooks/useFaltasAdvertencias';

const REG = (over: Partial<FaltaAdvertencia>): FaltaAdvertencia => ({
  id: Math.random().toString(36), tipo: 'falta', motivo: '', data_ocorrencia: '2026-05-01',
  created_at: '', updated_at: '', quantidade: 1, ...over,
});

function setup(registros: FaltaAdvertencia[] = [], salvarApuracaoMensal = vi.fn().mockResolvedValue({ inserted: 1 })) {
  return renderHook(
    (props: { competencia: string; registros: FaltaAdvertencia[] }) =>
      useOccurrenceDraft({ competencia: props.competencia, registros: props.registros, registrosLoading: false, salvarApuracaoMensal }),
    { initialProps: { competencia: '2026-05', registros } },
  );
}

describe('useOccurrenceDraft', () => {
  it('carrega o baseline a partir dos registros existentes da competência', async () => {
    const registros = [REG({ funcionario_id: 'f1', tipo: 'falta', quantidade: 2, data_ocorrencia: '2026-05-01' })];
    const { result } = setup(registros);
    await waitFor(() => expect(result.current.draft.f1?.faltas).toBe(2));
    expect(result.current.isDirty).toBe(false);
  });

  it('incremento e decremento via setEntry detectam alteração (isDirty)', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.isDirty).toBe(false));
    act(() => result.current.setEntry('f1', 'faltas', 3));
    expect(result.current.draft.f1.faltas).toBe(3);
    expect(result.current.isDirty).toBe(true);
    act(() => result.current.setEntry('f1', 'faltas', 0));
    expect(result.current.isDirty).toBe(false); // voltou ao baseline (vazio)
  });

  it('valores negativos são sanitizados para 0', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.isDirty).toBe(false));
    act(() => result.current.setEntry('f1', 'faltas', -7));
    expect(result.current.draft.f1.faltas).toBe(0);
  });

  it('restaurar uma linha individual volta ao valor do baseline', async () => {
    const registros = [REG({ funcionario_id: 'f1', tipo: 'falta', quantidade: 2, data_ocorrencia: '2026-05-01' })];
    const { result } = setup(registros);
    await waitFor(() => expect(result.current.draft.f1?.faltas).toBe(2));
    act(() => result.current.setEntry('f1', 'faltas', 9));
    expect(result.current.isDirty).toBe(true);
    act(() => result.current.restoreEntry('f1'));
    expect(result.current.draft.f1.faltas).toBe(2);
    expect(result.current.isDirty).toBe(false);
  });

  it('operações em massa aplicam a todos os ids selecionados', async () => {
    const { result } = setup();
    await waitFor(() => expect(result.current.isDirty).toBe(false));
    act(() => result.current.bulkSetFaltas(['f1', 'f2'], 2));
    expect(result.current.draft.f1.faltas).toBe(2);
    expect(result.current.draft.f2.faltas).toBe(2);
    act(() => result.current.bulkZerar(['f1']));
    expect(result.current.draft.f1.faltas).toBe(0);
    expect(result.current.draft.f2.faltas).toBe(2);
  });

  it('salvamento com sucesso atualiza o baseline e limpa o dirty', async () => {
    const salvar = vi.fn().mockResolvedValue({ inserted: 1 });
    const { result } = setup([], salvar);
    await waitFor(() => expect(result.current.isDirty).toBe(false));
    act(() => result.current.setEntry('f1', 'faltas', 3));
    expect(result.current.isDirty).toBe(true);

    let ok = false;
    await act(async () => { ok = await result.current.save(); });

    expect(ok).toBe(true);
    expect(salvar).toHaveBeenCalledWith('2026-05', { f1: { faltas: 3, advertencias: 0 } });
    expect(result.current.isDirty).toBe(false);
    expect(result.current.baseline.f1.faltas).toBe(3);
  });

  it('erro no salvamento preserva o estado dirty (nada é perdido silenciosamente)', async () => {
    const salvar = vi.fn().mockResolvedValue(null);
    const { result } = setup([], salvar);
    await waitFor(() => expect(result.current.isDirty).toBe(false));
    act(() => result.current.setEntry('f1', 'faltas', 3));

    let ok = true;
    await act(async () => { ok = await result.current.save(); });

    expect(ok).toBe(false);
    expect(result.current.isDirty).toBe(true);
    expect(result.current.error).toBeTruthy();
  });

  it('o payload de salvamento envia o estado NÃO-ZERO completo do draft (não um diff)', async () => {
    const registros = [
      REG({ funcionario_id: 'f1', tipo: 'falta', quantidade: 2, data_ocorrencia: '2026-05-01' }),
    ];
    const salvar = vi.fn().mockResolvedValue({ inserted: 2 });
    const { result } = setup(registros, salvar);
    await waitFor(() => expect(result.current.draft.f1?.faltas).toBe(2));
    // Altera só f2; f1 não foi tocado nesta sessão, mas já tinha ocorrência salva.
    act(() => result.current.setEntry('f2', 'advertencias', 1));
    await act(async () => { await result.current.save(); });
    // f1 precisa continuar no payload (senão seria apagado pelo delete+insert da competência).
    expect(salvar).toHaveBeenCalledWith('2026-05', {
      f1: { faltas: 2, advertencias: 0 },
      f2: { faltas: 0, advertencias: 1 },
    });
  });
});
