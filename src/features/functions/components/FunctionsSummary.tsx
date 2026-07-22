import { Briefcase, CheckCircle2, Unlink, AlertTriangle, GitCompare } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import type { FunctionSummaryCounts } from '../domain/functionFilters';
import type { FunctionFilters } from '../types/function.types';

interface Props { summary: FunctionSummaryCounts; grupos: number; onFilter: (patch: Partial<FunctionFilters>) => void }

/** Cards compactos do resumo — clicáveis para filtrar. */
export function FunctionsSummary({ summary, grupos, onFilter }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      <StatCard title="Total de funções" value={String(summary.total)} icon={Briefcase}
        onClick={() => onFilter({ utilizacao: 'todos', setorId: 'todos', situacao: 'todos' })} />
      <StatCard title="Em uso" value={String(summary.emUso)} icon={CheckCircle2} status="positive"
        onClick={() => onFilter({ utilizacao: 'em_uso' })} />
      <StatCard title="Sem vínculo" value={String(summary.semVinculo)} icon={Unlink} status={summary.semVinculo > 0 ? 'warning' : 'positive'}
        onClick={() => onFilter({ utilizacao: 'sem_vinculo' })} />
      <StatCard title="Para revisar" value={String(summary.aRevisar)} icon={AlertTriangle} status={summary.aRevisar > 0 ? 'warning' : 'positive'}
        onClick={() => onFilter({ situacao: 'revisar' })} />
      <StatCard title="Grupos semelhantes" value={String(grupos)} hint="possíveis correspondências" icon={GitCompare} status={grupos > 0 ? 'warning' : 'neutral'}
        onClick={() => onFilter({ situacao: 'possivel_correspondencia' })} />
    </div>
  );
}
