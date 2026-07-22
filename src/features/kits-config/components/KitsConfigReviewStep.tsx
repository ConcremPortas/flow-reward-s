import { competenciaLabelLong } from '@/features/dashboard/utils/dates';
import { KitsConfigComparison } from './KitsConfigComparison';
import { KitsConfigImpact } from './KitsConfigImpact';
import type { useKitsConfigEditor } from '../hooks/useKitsConfigEditor';
import type { KitsConfigRow } from '../types/kits-config.types';

type Editor = ReturnType<typeof useKitsConfigEditor>;

interface Props {
  ed: Editor;
  atual: KitsConfigRow | null;
  competenciaAtual: string;
  retro: { competencias: string[]; resultados: number };
}

export function KitsConfigReviewStep({ ed, atual, competenciaAtual, retro }: Props) {
  const p = ed.parsed;
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border/70 p-3 text-sm">
        <p className="font-semibold text-foreground">Vigência: {p.vigenciaInicio ? competenciaLabelLong(p.vigenciaInicio) : '—'}</p>
        <p className="text-muted-foreground">
          Mínimo {p.minimoKits ?? 0} · incremento {p.incrementoFaixa ?? 0} · base R$ {p.bonusBase ?? 0} · faixa R$ {p.bonusPorFaixa ?? 0} · máx. faixas {p.maxFaixas ?? 'sem limite'}
        </p>
      </div>

      {atual && (
        <div>
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Comparação com a regra atual</p>
          <KitsConfigComparison
            atual={{ minimoKits: atual.minimoKits, incrementoFaixa: atual.incrementoFaixa, bonusBase: atual.bonusBase, bonusPorFaixa: atual.bonusPorFaixa, maxFaixas: atual.maxFaixas }}
            nova={{ minimoKits: p.minimoKits ?? 0, incrementoFaixa: p.incrementoFaixa ?? 0, bonusBase: p.bonusBase ?? 0, bonusPorFaixa: p.bonusPorFaixa ?? 0, maxFaixas: p.maxFaixas }}
          />
        </div>
      )}

      {p.vigenciaInicio && <KitsConfigImpact novaVigencia={p.vigenciaInicio} atual={atual} competenciaAtual={competenciaAtual} retro={retro} />}

      {ed.validation.warnings.length > 0 && (
        <ul className="space-y-0.5 text-xs text-status-warning">{ed.validation.warnings.map((w, i) => <li key={i}>• {w}</li>)}</ul>
      )}
      {ed.validation.errors.length > 0 && (
        <ul className="space-y-0.5 text-xs text-destructive">{ed.validation.errors.map((e, i) => <li key={i}>• {e}</li>)}</ul>
      )}
    </div>
  );
}
