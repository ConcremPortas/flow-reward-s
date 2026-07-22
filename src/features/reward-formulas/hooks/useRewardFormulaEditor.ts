import { useEffect, useMemo, useState } from 'react';
import { CRITERIOS, type WeightKey } from '../domain/rewardFormulaDefinitions';
import { validateFormulaWeights } from '../domain/rewardFormulaValidation';
import type { WeightMap } from '../domain/rewardFormulaWeights';
import type { RewardFormulaRow } from '../types/reward-formula.types';

const emptyWeights = (): WeightMap => Object.fromEntries(CRITERIOS.map(c => [c.key, 0])) as WeightMap;

export type EditorStep = 1 | 2 | 3;

export interface EditorInit {
  editing?: RewardFormulaRow | null;
  presetCategoriaId?: string | null;
  presetBaseId?: string | null;
  presetWeights?: WeightMap | null;
  presetNome?: string | null;
  presetDescricao?: string | null;
  /** Chave para forçar reinicialização (ex.: duplicar/criar da matriz). */
  seed?: string;
}

/** Estado do editor de fórmula em 3 etapas. Só SOMA pesos (não recalcula o motor). */
export function useRewardFormulaEditor(init: EditorInit, open: boolean) {
  const [step, setStep] = useState<EditorStep>(1);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [baseId, setBaseId] = useState('');
  const [multiplicadorKits, setMultiplicadorKits] = useState<number>(1);
  const [weights, setWeights] = useState<WeightMap>(emptyWeights());

  useEffect(() => {
    if (!open) return;
    const e = init.editing;
    setStep(1);
    setNome(e?.nome ?? init.presetNome ?? '');
    setDescricao(e?.descricao ?? init.presetDescricao ?? '');
    setCategoriaId(e?.categoriaId ?? init.presetCategoriaId ?? '');
    setBaseId(e?.baseId ?? init.presetBaseId ?? '');
    setMultiplicadorKits(e?.multiplicadorKits ?? 1);
    setWeights(e ? { ...e.weights } : init.presetWeights ? { ...init.presetWeights } : emptyWeights());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, init.editing?.id, init.seed]);

  const setWeight = (key: WeightKey, value: number) => {
    setWeights(prev => ({ ...prev, [key]: Number.isFinite(value) ? Math.max(0, value) : 0 }));
  };
  const zerarTodos = () => setWeights(emptyWeights());
  const copiarDe = (w: WeightMap) => setWeights({ ...w });

  /** Distribui 100 igualmente entre os critérios selecionados (resto no primeiro). */
  const distribuirIgualmente = (keys: WeightKey[]) => {
    if (keys.length === 0) return;
    const next = emptyWeights();
    const cada = Math.floor((10000 / keys.length)) / 100; // 2 casas
    let acc = 0;
    keys.forEach((k, i) => {
      const v = i === 0 ? Math.round((100 - cada * (keys.length - 1)) * 100) / 100 : cada;
      next[k] = v; acc += v;
    });
    void acc;
    setWeights(next);
  };

  const validation = useMemo(() => validateFormulaWeights(weights), [weights]);

  const buildPayload = () => ({
    nome: nome.trim(),
    descricao: descricao.trim() || null,
    categoria_id: categoriaId || null,
    base_premiacao_id: baseId || null,
    peso_producao_setor: weights.peso_producao_setor,
    peso_faturamento: weights.peso_faturamento,
    peso_epi: weights.peso_epi,
    peso_faltas: weights.peso_faltas,
    peso_dss: weights.peso_dss,
    peso_itens_nc: weights.peso_itens_nc,
    peso_advertencias: weights.peso_advertencias,
    peso_tratamento_nc: weights.peso_tratamento_nc,
    peso_hora_maquina: weights.peso_hora_maquina,
    peso_operacao_segura: weights.peso_operacao_segura,
    peso_limpeza: weights.peso_limpeza,
    multiplicador_kits: multiplicadorKits,
    ativo: true,
  });

  return {
    step, setStep,
    nome, setNome, descricao, setDescricao,
    categoriaId, setCategoriaId, baseId, setBaseId,
    multiplicadorKits, setMultiplicadorKits,
    weights, setWeight, zerarTodos, distribuirIgualmente, copiarDe,
    validation, buildPayload,
  };
}
