import { Users, UserCheck, UserX, Percent } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';

interface Props {
  vinculados: number;
  presentes: number;
  ausentes: number;
  participacaoPct: number;
}

export function DssAttendanceSummary({ vinculados, presentes, ausentes, participacaoPct }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard title="Vinculados" value={String(vinculados)} hint="ativos no local" icon={Users} />
      <StatCard title="Presentes" value={String(presentes)} hint="marcados" icon={UserCheck} status="positive" />
      <StatCard title="Ausentes" value={String(ausentes)} hint="marcados" icon={UserX} status={ausentes > 0 ? 'warning' : 'positive'} />
      <StatCard title="Participação" value={`${participacaoPct.toFixed(0)}%`} hint="do total vinculado" icon={Percent} status={participacaoPct >= 90 ? 'positive' : participacaoPct >= 70 ? 'warning' : 'critical'} />
    </div>
  );
}
