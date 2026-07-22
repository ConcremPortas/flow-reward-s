import { useEffect, useMemo, useState } from 'react';
import { validateKitsConfig } from '../domain/kitsConfigValidation';
import type { KitsConfigRow } from '../types/kits-config.types';

export type EditorStep = 1 | 2;

export interface KitsEditorInit {
  editing?: KitsConfigRow | null;
  /** Preset ao "criar nova vigência a partir desta" (copia só parâmetros). */
  presetFrom?: KitsConfigRow | null;
  seed?: string;
}

const numOrNull = (s: string): number | null => {
  const t = s.trim().replace(/\./g, '').replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
};

export function useKitsConfigEditor(init: KitsEditorInit, open: boolean) {
  const [step, setStep] = useState<EditorStep>(1);
  const [vigencia, setVigencia] = useState('');
  const [minimo, setMinimo] = useState('');
  const [incremento, setIncremento] = useState('');
  const [bonusBase, setBonusBase] = useState('');
  const [bonusFaixa, setBonusFaixa] = useState('');
  const [semLimite, setSemLimite] = useState(true);
  const [maxFaixas, setMaxFaixas] = useState('');

  useEffect(() => {
    if (!open) return;
    const src = init.editing ?? init.presetFrom ?? null;
    setStep(1);
    // "Criar nova vigência a partir desta" copia parâmetros mas NÃO a vigência.
    setVigencia(init.editing?.vigenciaInicio ?? '');
    setMinimo(src ? String(src.minimoKits) : '');
    setIncremento(src ? String(src.incrementoFaixa) : '');
    setBonusBase(src ? String(src.bonusBase) : '');
    setBonusFaixa(src ? String(src.bonusPorFaixa) : '');
    const mf = src?.maxFaixas ?? null;
    setSemLimite(mf == null);
    setMaxFaixas(mf == null ? '' : String(mf));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, init.editing?.id, init.seed]);

  const parsed = useMemo(() => ({
    vigenciaInicio: vigencia,
    minimoKits: numOrNull(minimo),
    incrementoFaixa: numOrNull(incremento),
    bonusBase: numOrNull(bonusBase),
    bonusPorFaixa: numOrNull(bonusFaixa),
    maxFaixas: semLimite ? null : numOrNull(maxFaixas),
  }), [vigencia, minimo, incremento, bonusBase, bonusFaixa, semLimite, maxFaixas]);

  const validation = useMemo(() => validateKitsConfig(parsed), [parsed]);

  const buildPayload = () => ({
    vigencia_inicio: parsed.vigenciaInicio,
    minimo_kits: parsed.minimoKits ?? 0,
    incremento_faixa: parsed.incrementoFaixa ?? 0,
    bonus_base: parsed.bonusBase ?? 0,
    bonus_por_faixa: parsed.bonusPorFaixa ?? 0,
    max_faixas: parsed.maxFaixas,
    ativo: true,
  });

  return {
    step, setStep,
    vigencia, setVigencia, minimo, setMinimo, incremento, setIncremento,
    bonusBase, setBonusBase, bonusFaixa, setBonusFaixa, semLimite, setSemLimite, maxFaixas, setMaxFaixas,
    parsed, validation, buildPayload,
  };
}
