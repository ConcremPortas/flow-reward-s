import { useEffect, useMemo, useState } from 'react';
import { currentCompetencia } from '@/features/dashboard/utils/dates';
import type { UseRewardsProcessingReturn } from '../hooks/useRewardsProcessing';
import { useRewardsValidation } from '../hooks/useRewardsValidation';
import { useRewardsPreview } from '../hooks/useRewardsPreview';
import { findExistingProcessing } from '../domain/rewardsProcessingScope';
import { compareBasePreview } from '../domain/rewardsComparison';
import { RewardsProcessingStepper, type StepKey } from '../components/RewardsProcessingStepper';
import { RewardsParametersStep } from '../components/RewardsParametersStep';
import { RewardsValidationStep } from '../components/RewardsValidationStep';
import { RewardsPreviewStep } from '../components/RewardsPreviewStep';
import { RewardsConfirmationStep } from '../components/RewardsConfirmationStep';
import { RewardsProcessingStatus, type ProcessingPhase } from '../components/RewardsProcessingStatus';
import { RewardsProcessingResult, type ResultData } from '../components/RewardsProcessingResult';
import type { ParametersSummaryData } from '../components/RewardsParametersSummary';
import type { ComparisonResult, ExistingProcessing, RewardsPreview } from '../types/rewards-processing.types';

export interface ProcessingSeed { competencia: string; baseIds: string[]; categoriaIds: string[] }

interface Props {
  data: UseRewardsProcessingReturn;
  seed: ProcessingSeed | null;
  onSeedConsumed: () => void;
  onOpenReport: (p?: { competencia?: string; baseId?: string }) => void;
  onGoProcessamentos: () => void;
}

export function NewRewardsProcessingView({ data, seed, onSeedConsumed, onOpenReport, onGoProcessamentos }: Props) {
  const [competencia, setCompetencia] = useState(currentCompetencia());
  const [baseIds, setBaseIds] = useState<string[]>([]);
  const [categoriaIds, setCategoriaIds] = useState<string[]>([]);
  const [step, setStep] = useState<StepKey>('parametros');
  const [reached, setReached] = useState<Set<StepKey>>(new Set(['parametros']));
  const [preview, setPreview] = useState<RewardsPreview | null>(null);
  const [saving, setSaving] = useState(false);
  const [phase, setPhase] = useState<ProcessingPhase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResultData | null>(null);

  const params = useMemo(() => ({ competencia, baseIds, categoriaIds }), [competencia, baseIds, categoriaIds]);

  // Semear a partir de "Reprocessar".
  useEffect(() => {
    if (!seed) return;
    setCompetencia(seed.competencia); setBaseIds(seed.baseIds); setCategoriaIds(seed.categoriaIds);
    setStep('parametros'); setReached(new Set(['parametros'])); setPreview(null); setResult(null);
    onSeedConsumed();
  }, [seed, onSeedConsumed]);

  const validation = useRewardsValidation(params, data.previewInputs, data.categorias);
  const runPreview = useRewardsPreview(data.previewInputs);

  const existings = useMemo<ExistingProcessing[]>(
    () => baseIds.map(id => findExistingProcessing(data.resultados, data.bases, competencia, id)).filter((x): x is ExistingProcessing => x != null),
    [baseIds, data.resultados, data.bases, competencia],
  );

  const goTo = (s: StepKey) => { setStep(s); setReached(prev => new Set(prev).add(s)); };

  const summary = useMemo<ParametersSummaryData>(() => {
    const naBase = data.funcionarios.filter(f => baseIds.includes(f.base_premiacao_id || ''));
    const ativos = naBase.filter(f => f.ativo);
    const elegiveis = ativos.filter(f => categoriaIds.length === 0 || categoriaIds.includes(f.categoria_id || ''));
    return {
      encontrados: naBase.length,
      ativos: ativos.length,
      elegiveis: elegiveis.length,
      naoElegiveis: naBase.length - elegiveis.length,
      categorias: new Set(elegiveis.map(f => f.categoria?.nome).filter(Boolean)).size,
      setores: new Set(elegiveis.map(f => f.setor_id).filter(Boolean)).size,
      cadastrosIncompletos: elegiveis.filter(f => !f.categoria_id || !f.faixa_id || (!f.setor_id && !(f.setor_ids && f.setor_ids.length))).length,
      existentes: existings.map(e => ({ competencia: e.competencia, baseNome: e.baseNome })),
    };
  }, [data.funcionarios, baseIds, categoriaIds, existings]);

  const startPreview = () => { setPreview(runPreview(params)); goTo('previa'); };

  const getComparison = (baseId: string): ComparisonResult => {
    const bp = preview!.bases.find(b => b.baseId === baseId)!;
    return compareBasePreview(bp, data.resultados, competencia);
  };

  const baseNomes = useMemo(() => baseIds.map(id => data.bases.find(b => b.id === id)?.nome ?? '').filter(Boolean), [baseIds, data.bases]);

  const handleConfirm = async () => {
    if (saving || !preview) return;
    setSaving(true); setPhase('salvando'); setError(null);
    try {
      let ok = true;
      for (const b of preview.bases) {
        const res = await data.salvarResultados(competencia, b.baseId, b.employees);
        if (!res) ok = false;
      }
      if (!ok) { setError('Não foi possível salvar todo o processamento. A prévia foi mantida.'); setPhase(null); return; }
      setPhase('concluido');
      setResult({
        competencia, baseNomes,
        funcionarios: preview.totals.funcionariosCalculados,
        comBonus: preview.totals.comBonus,
        semBonus: preview.totals.semBonus,
        valorTotal: preview.totals.valorTotal,
        processadoEm: new Date(),
      });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setStep('parametros'); setReached(new Set(['parametros'])); setPreview(null); setResult(null); setError(null); setPhase(null);
  };

  // Resultado final
  if (result) {
    return (
      <RewardsProcessingResult
        data={result}
        onReport={() => onOpenReport({ competencia, baseId: baseIds[0] })}
        onDetails={onGoProcessamentos}
        onNew={reset}
      />
    );
  }

  // Salvando
  if (saving || phase === 'salvando') {
    return <RewardsProcessingStatus phase={phase ?? 'salvando'} />;
  }

  return (
    <div className="space-y-4">
      <RewardsProcessingStepper current={step} reached={reached} onGoTo={goTo} />

      {step === 'parametros' && (
        <RewardsParametersStep
          competencia={competencia} baseIds={baseIds} categoriaIds={categoriaIds}
          bases={data.bases} categorias={data.categoriasPremiaveis} summary={summary}
          onChange={(p) => { if (p.competencia !== undefined) setCompetencia(p.competencia); if (p.baseIds) setBaseIds(p.baseIds); if (p.categoriaIds) setCategoriaIds(p.categoriaIds); }}
          onNext={() => goTo('validacao')}
          canNext={baseIds.length > 0 && !!competencia}
        />
      )}

      {step === 'validacao' && (
        <RewardsValidationStep validation={validation} onRevalidate={data.refetch} onBack={() => goTo('parametros')} onNext={startPreview} />
      )}

      {step === 'previa' && preview && (
        <RewardsPreviewStep preview={preview} existings={existings} getComparison={getComparison} onBack={() => goTo('validacao')} onNext={() => goTo('confirmacao')} />
      )}

      {step === 'confirmacao' && preview && (
        <RewardsConfirmationStep
          preview={preview} baseNomes={baseNomes} existings={existings} saving={saving} error={error}
          onBack={() => goTo('previa')} onCancel={reset} onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
