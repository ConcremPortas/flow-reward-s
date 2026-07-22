import { ClipboardCheck, Gauge, Users, AlertTriangle, Trophy, Clock } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { formatDateBR } from '@/lib/dateTime';
import type { EpiAuditGroupEnriched } from '@/features/epi/domain/epiCalculations';

interface Props { rows: EpiAuditGroupEnriched[] }

export function EpiHistorySummary({ rows }: Props) {
  const comTaxa = rows.filter((r) => r.taxaConformidade != null);
  const taxaMedia = comTaxa.length > 0 ? comTaxa.reduce((a, r) => a + (r.taxaConformidade as number), 0) / comTaxa.length : null;
  const pessoasAuditadas = rows.reduce((a, r) => a + r.totalAuditados, 0);
  const naoConformidades = rows.reduce((a, r) => a + r.naoConformes, 0);
  const com100 = rows.filter((r) => r.taxaConformidade === 100).length;
  const ultimo = [...rows].sort((a, b) => (a.data < b.data ? 1 : -1))[0];

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      <StatCard title="Auditorias realizadas" value={String(rows.length)} hint="no filtro atual" icon={ClipboardCheck} />
      <StatCard title="Taxa média" value={taxaMedia != null ? `${taxaMedia.toFixed(1)}%` : '—'} hint="calculável" icon={Gauge} status={taxaMedia == null ? 'neutral' : taxaMedia >= 90 ? 'positive' : 'warning'} />
      <StatCard title="Pessoas auditadas" value={String(pessoasAuditadas)} hint="somadas" icon={Users} />
      <StatCard title="Não conformidades" value={String(naoConformidades)} hint="somadas" icon={AlertTriangle} status={naoConformidades > 0 ? 'warning' : 'positive'} />
      <StatCard title="Auditorias com 100%" value={String(com100)} hint="conformidade total" icon={Trophy} status="positive" />
      <StatCard title="Última auditoria" value={formatDateBR(ultimo?.data)} hint={ultimo?.titulo || 'sem registros'} icon={Clock} />
    </div>
  );
}
