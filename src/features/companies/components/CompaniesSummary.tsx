import { Building2, CheckCircle2, AlertTriangle, Network } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { formatNumberBR } from '@/lib/formatters';
import type { CompanySummaryCounts } from '../domain/companyFilters';
import type { CompanyFilters } from '../types/company.types';

interface Props { summary: CompanySummaryCounts; onFilter: (patch: Partial<CompanyFilters>) => void }

/** Resumo compacto — evita cards redundantes: total, ativas, a revisar, estrutura. */
export function CompaniesSummary({ summary, onFilter }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard title="Empresas" value={formatNumberBR(summary.total)} icon={Building2} onClick={() => onFilter({ situacao: 'todos' })} />
      <StatCard title="Ativas" value={formatNumberBR(summary.ativas)} icon={CheckCircle2} status="positive" />
      <StatCard title="A revisar" value={formatNumberBR(summary.aRevisar)} icon={AlertTriangle} status={summary.aRevisar > 0 ? 'warning' : 'positive'} onClick={() => onFilter({ situacao: 'revisar' })} />
      <StatCard title="Estrutura vinculada" value={formatNumberBR(summary.setoresVinculados)} hint={`${formatNumberBR(summary.funcionariosVinculados)} funcionários`} icon={Network} />
    </div>
  );
}
