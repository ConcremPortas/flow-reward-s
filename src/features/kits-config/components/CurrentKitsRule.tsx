import { Sparkles, Calculator, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrencyBRL, formatNumberBR } from '@/lib/formatters';
import { KitsConfigStatus } from './KitsConfigStatus';
import { KitsBonusBreakdown } from './KitsBonusBreakdown';
import { periodLabel, vigenciaLabel } from './periodLabel';
import type { KitsConfigRow } from '../types/kits-config.types';

interface Props {
  atual: KitsConfigRow | null;
  proxima: KitsConfigRow | null;
  onSimular: (r: KitsConfigRow) => void;
  onNovaVigencia: () => void;
}

/** Painel prioritário da regra vigente + exemplo pelo motor real. */
export function CurrentKitsRule({ atual, proxima, onSimular, onNovaVigencia }: Props) {
  if (!atual) {
    return (
      <div className="rounded-2xl border border-status-warning/40 bg-status-warning/5 p-4">
        <p className="text-sm font-medium text-status-warning">Nenhuma regra vigente para a competência atual.</p>
        <p className="mt-1 text-xs text-muted-foreground">Sem configuração anterior à competência, o processamento usa a configuração-padrão do motor (10.000 kits · R$ 100,00 base · R$ 25,00/faixa).</p>
      </div>
    );
  }
  const cfg = { minimoKits: atual.minimoKits, incrementoFaixa: atual.incrementoFaixa, bonusBase: atual.bonusBase, bonusPorFaixa: atual.bonusPorFaixa, maxFaixas: atual.maxFaixas };
  const exemploKits = atual.minimoKits + atual.incrementoFaixa * 10;

  return (
    <div className="rounded-2xl border border-[#c8a83f]/40 bg-gradient-to-br from-[#f7f0d7]/50 to-transparent p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#7a5f16]" />
          <span className="text-sm font-semibold text-[#7a5f16]">Regra vigente</span>
          <KitsConfigStatus state={atual.state} />
        </div>
        <span className="text-xs text-muted-foreground">{periodLabel(atual)}</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Param label="Mínimo de kits" value={`${formatNumberBR(atual.minimoKits)}`} />
        <Param label="Incremento" value={`${formatNumberBR(atual.incrementoFaixa)} kits`} />
        <Param label="Bônus base" value={formatCurrencyBRL(atual.bonusBase)} gold />
        <Param label="Bônus por faixa" value={formatCurrencyBRL(atual.bonusPorFaixa)} gold />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-card/60 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Exemplo (motor)</p>
          <div className="mt-1"><KitsBonusBreakdown kits={exemploKits} config={cfg} /></div>
        </div>
        <div className="flex flex-col justify-between gap-3">
          <div className="rounded-xl border border-border/70 bg-card/60 p-3 text-sm">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" /> Próxima alteração</p>
            <p className="mt-1 text-foreground">{proxima ? `${vigenciaLabel(proxima)} (programada)` : 'Nenhuma alteração programada.'}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Máximo de faixas: {atual.maxFaixas != null ? `${formatNumberBR(atual.maxFaixas)} (não aplicado pelo motor)` : 'sem limite'}.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => onSimular(atual)}><Calculator className="h-4 w-4" /> Simular</Button>
            <Button size="sm" className="gap-1.5" onClick={onNovaVigencia}>Criar nova vigência</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Param({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`text-base font-bold tabular-nums ${gold ? 'text-[#7a5f16]' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
