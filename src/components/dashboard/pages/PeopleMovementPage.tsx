import { Users, UserPlus, UserMinus, Scale, TrendingUp } from 'lucide-react';
import { fmtInt, fmtPct } from '@/features/dashboard/utils/format';
import { StatCard } from '../StatCard';
import { WorkforceEvolution } from '../WorkforceEvolution';
import { WorkforceMovement } from '../WorkforceMovement';
import { TurnoverAnalytics } from '../TurnoverAnalytics';
import type { PageProps } from './_shared';

/** Página 2 — Pessoas e Movimentação. */
export function PeopleMovementPage({ dash }: PageProps) {
  const mv = dash.workforce[dash.workforce.length - 1] ?? null;
  const final = mv?.ativos ?? 0, adm = mv?.admissoes ?? 0, desl = mv?.desligamentos ?? 0;
  const saldo = adm - desl;
  const turnover = dash.executive.find((m) => m.key === 'turnover');

  return (
    <div className="space-y-[18px]">
      <div className="grid grid-cols-2 items-stretch gap-[18px] md:grid-cols-3 min-[1400px]:grid-cols-5">
        <StatCard title="Quadro atual" value={fmtInt(final)} hint="colaboradores ativos" icon={Users} />
        <StatCard title="Admissões" value={fmtInt(adm)} hint="no período" icon={UserPlus} status="positive" />
        <StatCard title="Desligamentos" value={fmtInt(desl)} hint="no período" icon={UserMinus} status={desl > 0 ? 'warning' : 'positive'} />
        <StatCard title="Saldo" value={`${saldo > 0 ? '+' : ''}${fmtInt(saldo)}`} hint="admissões − desligamentos" icon={Scale} status={saldo >= 0 ? 'positive' : 'critical'} />
        <StatCard title="Turnover" value={turnover?.value != null ? fmtPct(turnover.value) : '—'} hint="rotatividade do mês" icon={TrendingUp} status={turnover?.status} />
      </div>

      <div className="grid grid-cols-1 gap-[18px] xl:grid-cols-12">
        <WorkforceEvolution className="xl:col-span-8" data={dash.workforce} onMonthClick={(c) => dash.setFilters({ competencia: c })} />
        <WorkforceMovement className="xl:col-span-4" point={mv} />
      </div>

      <TurnoverAnalytics workforce={dash.workforce} />

      <p className="text-[11px] text-muted-foreground">
        Tempo de casa, estabilidade por setor e motivos de desligamento dependem de dados ainda não registrados no banco (ver Qualidade de Dados na Visão Executiva).
      </p>
    </div>
  );
}
