import { Users, UserCheck, UserX, MapPinOff, ClipboardList, Gift } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';

export interface EmployeesSummaryCounts {
  total: number;
  ativos: number;
  inativos: number;
  semSetor: number;
  incompletos: number;
  naoElegiveis: number;
}

interface EmployeesSummaryProps {
  counts: EmployeesSummaryCounts;
  onFilterClick: (key: keyof EmployeesSummaryCounts) => void;
}

const pct = (n: number, total: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : '—');

/** Faixa compacta de indicadores — cada card aplica um filtro ao clicar. */
export function EmployeesSummary({ counts, onFilterClick }: EmployeesSummaryProps) {
  const c = counts;
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
      <StatCard title="Total" value={String(c.total)} hint="cadastrados" icon={Users} onClick={() => onFilterClick('total')} />
      <StatCard title="Ativos" value={String(c.ativos)} hint={`${pct(c.ativos, c.total)} do total`} icon={UserCheck} status="positive" onClick={() => onFilterClick('ativos')} />
      <StatCard title="Inativos" value={String(c.inativos)} hint={`${pct(c.inativos, c.total)} do total`} icon={UserX} status={c.inativos > 0 ? 'warning' : 'positive'} onClick={() => onFilterClick('inativos')} />
      <StatCard title="Sem setor" value={String(c.semSetor)} hint="pendência cadastral" icon={MapPinOff} status={c.semSetor > 0 ? 'critical' : 'positive'} onClick={() => onFilterClick('semSetor')} />
      <StatCard title="Cadastros incompletos" value={String(c.incompletos)} hint="campos essenciais ausentes" icon={ClipboardList} status={c.incompletos > 0 ? 'warning' : 'positive'} onClick={() => onFilterClick('incompletos')} />
      <StatCard title="Não elegíveis" value={String(c.naoElegiveis)} hint="sem base de premiação" icon={Gift} status={c.naoElegiveis > 0 ? 'warning' : 'positive'} onClick={() => onFilterClick('naoElegiveis')} />
    </div>
  );
}
