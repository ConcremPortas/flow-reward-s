import { History, GitCompareArrows } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrencyBRL } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import type { ExistingProcessing } from '../types/rewards-processing.types';

interface Props {
  existing: ExistingProcessing;
  novoValor: number;
  onCompare: () => void;
}

/** Aviso de processamento existente para o escopo, com comparação de valores. */
export function RewardsExistingProcessing({ existing, novoValor, onCompare }: Props) {
  const diff = novoValor - existing.valorTotal;
  return (
    <div className="rounded-xl border border-status-warning/30 bg-status-warning/[0.04] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-status-warning/10 text-status-warning"><History className="h-4 w-4" /></span>
          <div>
            <p className="text-sm font-semibold text-foreground">Já existe processamento para {existing.baseNome}</p>
            <p className="text-xs text-muted-foreground">
              {existing.resultados} resultado(s) · {existing.categorias.join(', ') || 'sem categorias'}
              {existing.processadoEm ? ` · processado em ${formatDateTimeBR(existing.processadoEm)}` : ''}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={onCompare}><GitCompareArrows className="h-4 w-4" /> Comparar alterações</Button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
        <Cell label="Valor anterior" value={formatCurrencyBRL(existing.valorTotal)} />
        <Cell label="Novo valor" value={formatCurrencyBRL(novoValor)} />
        <Cell label="Diferença" value={`${diff >= 0 ? '+' : '−'}${formatCurrencyBRL(Math.abs(diff))}`} tone={diff === 0 ? undefined : diff > 0 ? 'up' : 'down'} />
      </div>
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn('mt-0.5 truncate text-sm font-semibold tabular-nums', tone === 'up' ? 'text-success' : tone === 'down' ? 'text-destructive' : 'text-foreground')}>{value}</p>
    </div>
  );
}
