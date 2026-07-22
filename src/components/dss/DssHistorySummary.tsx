import { CalendarCheck, Gauge, Users, Building2, Clock } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { formatDateBR } from '@/lib/dateTime';
import type { DssHistoryRow } from '@/features/dss/types';

interface Props { rows: DssHistoryRow[] }

export function DssHistorySummary({ rows }: Props) {
  const totalPresencas = rows.reduce((a, r) => a + r.presentes, 0);
  const comParticipacao = rows.filter((r) => r.participacao != null);
  const participacaoMedia = comParticipacao.length > 0
    ? comParticipacao.reduce((a, r) => a + (r.participacao as number), 0) / comParticipacao.length
    : null;
  const locaisAtendidos = new Set(rows.map((r) => r.localId).filter(Boolean)).size;
  const ultimo = [...rows].sort((a, b) => (a.data_realizacao < b.data_realizacao ? 1 : -1))[0];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      <StatCard title="DSS realizados" value={String(rows.length)} hint="no filtro atual" icon={CalendarCheck} />
      <StatCard title="Participação média" value={participacaoMedia != null ? `${participacaoMedia.toFixed(1)}%` : '—'} hint="calculável" icon={Gauge} status={participacaoMedia == null ? 'neutral' : participacaoMedia >= 90 ? 'positive' : 'warning'} />
      <StatCard title="Total de presenças" value={String(totalPresencas)} hint="somadas" icon={Users} />
      <StatCard title="Locais atendidos" value={String(locaisAtendidos)} hint="distintos" icon={Building2} />
      <StatCard title="Último DSS" value={formatDateBR(ultimo?.data_realizacao)} hint={ultimo?.titulo || 'sem registros'} icon={Clock} />
    </div>
  );
}
