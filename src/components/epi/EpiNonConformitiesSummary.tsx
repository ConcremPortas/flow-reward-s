import { AlertTriangle, Users, Building2, Repeat, Percent, TrendingUp, TrendingDown } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import type { EpiNonConformityRow } from '@/features/epi/types/epi.types';
import type { NonConformitySummary } from '@/features/epi/domain/epiCalculations';

interface Props {
  rows: EpiNonConformityRow[];
  summary: NonConformitySummary;
}

export function EpiNonConformitiesSummary({ rows, summary }: Props) {
  const setoresAfetados = new Set(rows.map((r) => r.setorNome).filter(Boolean)).size;
  const reincidencias = rows.filter((r) => r.reincidente).length;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      <StatCard title="Não conformidades" value={String(summary.naoConformes)} hint="no período" icon={AlertTriangle} status={summary.naoConformes > 0 ? 'warning' : 'positive'} />
      <StatCard title="Funcionários envolvidos" value={String(rows.length)} hint="com ao menos 1 ocorrência" icon={Users} />
      <StatCard title="Setores afetados" value={String(setoresAfetados)} hint="distintos" icon={Building2} />
      <StatCard title="Reincidências" value={String(reincidencias)} hint="2+ em 3 auditorias" icon={Repeat} status={reincidencias > 0 ? 'critical' : 'positive'} />
      <StatCard title="Taxa de não conformidade" value={summary.taxaNaoConformidade != null ? `${summary.taxaNaoConformidade.toFixed(1)}%` : '—'} hint="do total auditado" icon={Percent} status={summary.taxaNaoConformidade == null ? 'neutral' : summary.taxaNaoConformidade > 20 ? 'critical' : summary.taxaNaoConformidade > 10 ? 'warning' : 'positive'} />
      <StatCard
        title="Variação"
        value={summary.variacao == null ? '—' : `${summary.variacao > 0 ? '+' : ''}${summary.variacao.toFixed(0)}%`}
        hint={summary.variacao == null ? 'defina um período' : 'vs. janela anterior'}
        icon={summary.variacao != null && summary.variacao < 0 ? TrendingDown : TrendingUp}
        status={summary.variacao == null ? 'neutral' : summary.variacao <= 0 ? 'positive' : 'warning'}
      />
    </div>
  );
}
