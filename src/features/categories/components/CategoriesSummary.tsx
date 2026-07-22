import { Tags, Users, UserX, Award } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { formatNumberBR } from '@/lib/formatters';
import type { CategorySummaryCounts } from '../domain/categoryFilters';
import type { CategoryFilters } from '../types/category.types';

interface Props { summary: CategorySummaryCounts; onFilter: (patch: Partial<CategoryFilters>) => void }

/** Cards compactos do resumo — clicáveis quando aplicam filtro. */
export function CategoriesSummary({ summary, onFilter }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard title="Categorias" value={formatNumberBR(summary.total)} icon={Tags}
        onClick={() => onFilter({ utilizacao: 'todos' })} />
      <StatCard title="Funcionários vinculados" value={formatNumberBR(summary.funcionariosVinculados)} icon={Users} hint="total classificado" />
      <StatCard title="Sem funcionários" value={formatNumberBR(summary.semFuncionarios)} icon={UserX} status={summary.semFuncionarios > 0 ? 'warning' : 'positive'}
        onClick={() => onFilter({ utilizacao: 'sem_funcionarios' })} />
      <StatCard title="Usadas em premiação" value={formatNumberBR(summary.emPremiacao)} icon={Award} status="info"
        onClick={() => onFilter({ utilizacao: 'em_premiacao' })} />
    </div>
  );
}
