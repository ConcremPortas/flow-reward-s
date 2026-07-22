import { Building2, CheckCircle2, UserX, HardHat, Users } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import type { SectorSummaryCounts } from '../domain/sectorFilters';
import type { SectorFilters } from '../types/sector.types';
import { SEM_LIDERANCA } from '../domain/sectorFilters';

interface Props { summary: SectorSummaryCounts; onFilter: (patch: Partial<SectorFilters>) => void }

/** Cards compactos do resumo — clicáveis para filtrar. Sem gráficos. */
export function SectorsSummary({ summary, onFilter }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      <StatCard title="Total de setores" value={String(summary.total)} icon={Building2}
        onClick={() => onFilter({ situacao: 'todos', supervisorId: 'todos', encarregadoId: 'todos' })} />
      <StatCard title="Estrutura completa" value={String(summary.completos)} icon={CheckCircle2} status="positive"
        onClick={() => onFilter({ situacao: 'completo' })} />
      <StatCard title="Sem supervisor" value={String(summary.semSupervisor)} icon={UserX} status={summary.semSupervisor > 0 ? 'warning' : 'positive'}
        onClick={() => onFilter({ supervisorId: SEM_LIDERANCA })} />
      <StatCard title="Sem encarregado" value={String(summary.semEncarregado)} icon={HardHat} status={summary.semEncarregado > 0 ? 'warning' : 'positive'}
        onClick={() => onFilter({ encarregadoId: SEM_LIDERANCA })} />
      <StatCard title="Sem funcionários" value={String(summary.semFuncionarios)} icon={Users} status={summary.semFuncionarios > 0 ? 'warning' : 'positive'} />
    </div>
  );
}
