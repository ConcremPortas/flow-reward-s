import { Users, UserX, AlertTriangle, ShieldAlert, Gauge, Pencil } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';

export interface OccurrencesSummaryCounts {
  funcionariosAtivos: number;
  funcionariosComFaltas: number;
  totalFaltas: number;
  funcionariosAdvertidos: number;
  totalAdvertencias: number;
  registrosAlterados: number;
}

interface Props {
  counts: OccurrencesSummaryCounts;
  onFilterClick: (key: keyof OccurrencesSummaryCounts) => void;
}

/** Resumo compacto do período — cada card aplica um filtro ao clicar. */
export function OccurrencesSummary({ counts: c, onFilterClick }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      <StatCard title="Funcionários ativos" value={String(c.funcionariosAtivos)} hint="na apuração" icon={Users} onClick={() => onFilterClick('funcionariosAtivos')} />
      <StatCard title="Com faltas" value={String(c.funcionariosComFaltas)} hint="funcionário(s)" icon={UserX} status={c.funcionariosComFaltas > 0 ? 'warning' : 'positive'} onClick={() => onFilterClick('funcionariosComFaltas')} />
      <StatCard title="Total de faltas" value={String(c.totalFaltas)} hint="no período" icon={AlertTriangle} status={c.totalFaltas > 0 ? 'warning' : 'positive'} onClick={() => onFilterClick('totalFaltas')} />
      <StatCard title="Advertidos" value={String(c.funcionariosAdvertidos)} hint="funcionário(s)" icon={ShieldAlert} status={c.funcionariosAdvertidos > 0 ? 'critical' : 'positive'} onClick={() => onFilterClick('funcionariosAdvertidos')} />
      <StatCard title="Total de advertências" value={String(c.totalAdvertencias)} hint="no período" icon={Gauge} status={c.totalAdvertencias > 0 ? 'critical' : 'positive'} onClick={() => onFilterClick('totalAdvertencias')} />
      <StatCard title="Registros alterados" value={String(c.registrosAlterados)} hint="não salvos" icon={Pencil} status={c.registrosAlterados > 0 ? 'info' : 'neutral'} onClick={() => onFilterClick('registrosAlterados')} />
    </div>
  );
}
