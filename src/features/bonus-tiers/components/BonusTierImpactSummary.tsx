import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrencyBRL, pluralizeBR } from '@/lib/formatters';
import type { TierUsage } from '../types/bonus-tier.types';

interface Props { usage: TierUsage; valorAtual: number; valorNovo: number }

/**
 * Impacto da alteração de valor. Mensagem baseada na persistência REAL auditada:
 * resultados salvos fazem snapshot de `valor_faixa` — só processamentos FUTUROS
 * são afetados; os já salvos NÃO são recalculados.
 */
export function BonusTierImpactSummary({ usage, valorAtual, valorNovo }: Props) {
  const dif = valorNovo - valorAtual;
  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Impacto da alteração</p>
      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">{pluralizeBR(usage.categorias, 'categoria relacionada', 'categorias relacionadas')}</span>
        <span className="text-muted-foreground">{pluralizeBR(usage.funcionarios, 'funcionário relacionado', 'funcionários relacionados')}</span>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
        <Cell label="Valor atual" value={formatCurrencyBRL(valorAtual)} />
        <Cell label="Novo valor" value={formatCurrencyBRL(valorNovo)} />
        <Cell label="Diferença" value={`${dif >= 0 ? '+' : '−'}${formatCurrencyBRL(Math.abs(dif))}`} tone={dif === 0 ? undefined : dif > 0 ? 'up' : 'down'} />
      </div>
      {usage.resultadosHistoricos > 0 && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          A alteração poderá afetar processamentos futuros. Processamentos já salvos ({pluralizeBR(usage.resultadosHistoricos, 'resultado', 'resultados')} com este nome) não serão recalculados automaticamente.
        </p>
      )}
      {usage.resultadosHistoricos === 0 && (
        <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          A alteração afeta apenas processamentos futuros. Resultados já salvos preservam o valor usado no processamento.
        </p>
      )}
    </div>
  );
}

function Cell({ label, value, tone }: { label: string; value: string; tone?: 'up' | 'down' }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn('mt-0.5 truncate font-semibold tabular-nums', tone === 'up' ? 'text-success' : tone === 'down' ? 'text-destructive' : 'text-foreground')}>{value}</p>
    </div>
  );
}
