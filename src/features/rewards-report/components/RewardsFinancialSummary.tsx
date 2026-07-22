import { Target, Award, Wallet, Scale, type LucideIcon } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatCurrencyBRL, formatPercentBR } from '@/lib/formatters';
import type { FinancialTotals } from '../types/rewards-report.types';

interface CardProps { title: string; value: string; icon: LucideIcon; description?: string; sub?: string; tooltip: string; gold?: boolean; tone?: 'up' | 'down' }

function Card({ title, value, icon: Icon, description, sub, tooltip, gold, tone }: CardProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn('flex h-full cursor-default flex-col justify-between rounded-xl border p-4 shadow-[var(--shadow-card)]',
          gold ? 'border-[#c8a83f]/40 bg-[#f7f0d7]/40' : 'border-border/70 bg-card')}>
          <div className="flex items-center justify-between gap-2">
            <p className={cn('text-[13px] font-medium', gold ? 'text-[#8a6d1f]' : 'text-muted-foreground')}>{title}</p>
            <Icon className={cn('h-4 w-4', gold ? 'text-[#c8a83f]' : 'text-muted-foreground/60')} />
          </div>
          <p className={cn('mt-2 truncate text-[1.5rem] font-bold leading-none tracking-tight', gold ? 'text-[#7a5f16]' : 'text-foreground')}>{value}</p>
          <div className="mt-1.5 space-y-0.5">
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {sub && <p className={cn('text-xs font-medium', tone === 'up' ? 'text-success' : tone === 'down' ? 'text-destructive' : 'text-muted-foreground')}>{sub}</p>}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[260px]">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

/** Quatro cards financeiros com a semântica auditada. */
export function RewardsFinancialSummary({ totals }: { totals: FinancialTotals }) {
  const perdaPot = totals.alcancado - totals.possivel;
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Card title="Bônus Possível" value={formatCurrencyBRL(totals.possivel)} icon={Target} gold
        description="Teto do período (base + valor fixo)"
        tooltip="Soma do bônus possível: valor-base da faixa (ou comissão de kits) somado ao valor fixo, sem aplicar a nota geral." />
      <Card title="Bônus Alcançado" value={formatCurrencyBRL(totals.alcancado)} icon={Award}
        description={totals.atingimento != null ? `${formatPercentBR((totals.alcancado / (totals.possivel || 1)) * 100, 1)} do potencial` : 'Resultado do motor'}
        sub={perdaPot !== 0 ? `${perdaPot >= 0 ? '+' : '−'}${formatCurrencyBRL(Math.abs(perdaPot))} vs. possível` : undefined}
        tone={perdaPot >= 0 ? 'up' : 'down'}
        tooltip="Resultado do motor: bônus base × nota geral + valor fixo. Reflete o desempenho nos critérios." />
      <Card title="Valor Final" value={formatCurrencyBRL(totals.final)} icon={Wallet}
        description={totals.temAjustes ? 'Com ajustes manuais' : 'Igual ao alcançado (sem ajuste)'}
        sub={totals.temAjustes ? `Ajustes: ${totals.ajustes >= 0 ? '+' : '−'}${formatCurrencyBRL(Math.abs(totals.ajustes))}` : undefined}
        tone={totals.ajustes >= 0 ? 'up' : 'down'}
        tooltip="Valor a pagar: usa o ajuste manual (valor_ajustado) quando existe; caso contrário, é igual ao bônus alcançado." />
      <Card title="Diferença" value={formatCurrencyBRL(totals.diferenca)} icon={Scale}
        description="Valor final − possível"
        sub={totals.atingimento != null ? `${formatPercentBR(totals.atingimento, 1)} de atingimento` : undefined}
        tone={totals.diferenca >= 0 ? 'up' : 'down'}
        tooltip="Diferença entre o valor final e o bônus possível. Negativa indica perda de potencial no período." />
    </div>
  );
}
