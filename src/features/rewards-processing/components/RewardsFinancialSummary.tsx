import { Users, Gift, CircleSlash, Wallet, Scale } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { formatCurrencyBRL } from '@/lib/formatters';
import type { PreviewTotals } from '../types/rewards-processing.types';

/** Resumo financeiro da prévia. Valor total com destaque dourado (moderado). */
export function RewardsFinancialSummary({ totals }: { totals: PreviewTotals }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      {/* Valor total — cartão financeiro com destaque dourado */}
      <div className="col-span-2 flex h-full flex-col justify-between rounded-xl border border-[#c8a83f]/40 bg-[#f7f0d7]/40 p-4 shadow-[var(--shadow-card)] md:col-span-1 xl:col-span-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[13px] font-medium text-[#8a6d1f]">Valor total projetado</p>
          <Wallet className="h-4 w-4 text-[#c8a83f]" />
        </div>
        <p className="mt-2 truncate text-[1.5rem] font-bold leading-none tracking-tight text-[#7a5f16]">{formatCurrencyBRL(totals.valorTotal)}</p>
        <p className="mt-1.5 text-xs text-[#8a6d1f]/80">de {formatCurrencyBRL(totals.valorPossivelTotal)} possível</p>
      </div>

      <StatCard title="Funcionários calculados" value={String(totals.funcionariosCalculados)} icon={Users} />
      <StatCard title="Com bônus" value={String(totals.comBonus)} icon={Gift} status="positive" />
      <StatCard title="Sem bônus" value={String(totals.semBonus)} icon={CircleSlash} status={totals.semBonus > 0 ? 'warning' : 'positive'} />
      <StatCard title="Valor médio" value={totals.valorMedio != null ? formatCurrencyBRL(totals.valorMedio) : '—'} icon={Scale} />
    </div>
  );
}
