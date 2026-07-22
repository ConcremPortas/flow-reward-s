import { Target, Wallet, CheckCircle2, Users, UserX, Coins } from 'lucide-react';
import { fmtCurrency, fmtInt } from '@/features/dashboard/utils/format';
import { StatCard } from '../StatCard';
import { RewardsIntelligence } from '../RewardsIntelligence';
import type { PageProps } from './_shared';

/** Página 5 — Premiação e Impacto Financeiro. */
export function RewardsImpactPage({ dash }: PageProps) {
  const r = dash.rewards;
  return (
    <div className="space-y-[18px]">
      <div className="grid grid-cols-2 items-stretch gap-[18px] md:grid-cols-3 min-[1400px]:grid-cols-6">
        <StatCard title="Total potencial" value={fmtCurrency(r.potencial)} hint="teto do período" icon={Target} />
        <StatCard title="Total projetado" value={fmtCurrency(r.projetado)} hint={`${((r.projetado / (r.potencial || 1)) * 100).toFixed(0)}% do potencial`} icon={Wallet} status="positive" />
        <StatCard title="Total aprovado" value="—" hint="sem fluxo de aprovação" icon={CheckCircle2} status="neutral" />
        <StatCard title="Elegíveis" value={fmtInt(r.elegiveis)} hint="com resultado" icon={Users} status="info" />
        <StatCard title="Não elegíveis" value={fmtInt(r.naoElegiveis)} hint="sem resultado" icon={UserX} status={r.naoElegiveis > 0 ? 'warning' : 'positive'} />
        <StatCard title="Valor médio" value={fmtCurrency(r.medio)} hint="por elegível" icon={Coins} />
      </div>

      <RewardsIntelligence rewards={r} />
    </div>
  );
}
