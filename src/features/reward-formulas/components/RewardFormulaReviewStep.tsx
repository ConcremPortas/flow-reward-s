import { AlertTriangle } from 'lucide-react';
import { formatPercentBR, pluralizeBR } from '@/lib/formatters';
import { weightEntries, type WeightMap } from '../domain/rewardFormulaWeights';
import type { WeightValidation } from '../domain/rewardFormulaValidation';
import { RewardFormulaWeightSummary } from './RewardFormulaWeightSummary';
import { RewardFormulaPreview } from './RewardFormulaPreview';
import type { RewardFormulaRow } from '../types/reward-formula.types';

interface Props {
  nome: string; descricao: string;
  categoriaNome: string | null; baseNome: string | null;
  weights: WeightMap; validation: WeightValidation;
  duplicados: RewardFormulaRow[];
  usageFuncionarios: number;
}

const pct = (n: number) => formatPercentBR(n, Number.isInteger(n) ? 0 : 1);

export function RewardFormulaReviewStep({ nome, descricao, categoriaNome, baseNome, weights, validation, duplicados, usageFuncionarios }: Props) {
  const ativos = weightEntries(weights).filter(e => e.value > 0);
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/70 p-3">
        <p className="text-sm font-semibold text-foreground">{nome || '—'}</p>
        <p className="text-sm text-muted-foreground">{categoriaNome ?? 'Sem categoria'} · {baseNome ?? 'Sem base'}</p>
        {descricao.trim() && <p className="mt-1 text-xs text-muted-foreground">{descricao}</p>}
      </div>

      <RewardFormulaWeightSummary weights={weights} validation={validation} />

      <div className="rounded-lg border border-border/70 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Critérios ({ativos.length})</p>
        <ul className="mt-1.5 grid grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2">
          {ativos.map(e => <li key={e.key} className="flex items-center justify-between text-sm"><span className="text-foreground">{e.label}</span><span className="font-semibold tabular-nums">{pct(e.value)}</span></li>)}
        </ul>
      </div>

      <RewardFormulaPreview weights={weights} baseNome={baseNome} />

      {usageFuncionarios > 0 && (
        <p className="text-xs text-muted-foreground">Utilização estimada: {pluralizeBR(usageFuncionarios, 'funcionário', 'funcionários')} na combinação categoria × base.</p>
      )}

      {!validation.valid && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="text-foreground">{validation.errors.join(' ')}</div>
        </div>
      )}
      {duplicados.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-status-warning/40 bg-status-warning/5 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
          <div className="text-foreground">Existe(m) {duplicados.length} fórmula(s) para a mesma categoria × base. A primeira por nome prevalece no cálculo.</div>
        </div>
      )}
    </div>
  );
}
