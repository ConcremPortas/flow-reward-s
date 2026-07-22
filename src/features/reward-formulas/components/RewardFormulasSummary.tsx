import { Calculator, CheckCircle2, Grid3x3, AlertTriangle, Copy } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import type { FormulaSummaryCounts } from '../domain/rewardFormulaFilters';
import type { RewardFormulaFilters } from '../types/reward-formula.types';

interface Props { summary: FormulaSummaryCounts; onFilter: (patch: Partial<RewardFormulaFilters>) => void; onGoCoverage: () => void }

export function RewardFormulasSummary({ summary, onFilter, onGoCoverage }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      <StatCard title="Fórmulas" value={String(summary.total)} icon={Calculator} onClick={() => onFilter({ situacao: 'todos', utilizacao: 'todos' })} />
      <StatCard title="Em uso" value={String(summary.emUso)} icon={CheckCircle2} status="positive" onClick={() => onFilter({ utilizacao: 'em_uso' })} />
      <StatCard title="Combinações cobertas" value={String(summary.combinacoesCobertas)} icon={Grid3x3} hint="categoria × base" onClick={onGoCoverage} />
      <StatCard title="A revisar" value={String(summary.aRevisar)} icon={AlertTriangle} status={summary.aRevisar > 0 ? 'warning' : 'positive'} onClick={() => onFilter({ situacao: 'incompleta' })} />
      <StatCard title="Possíveis duplicidades" value={String(summary.duplicidades)} icon={Copy} status={summary.duplicidades > 0 ? 'warning' : 'neutral'} onClick={() => onFilter({ situacao: 'possivel_duplicidade' })} />
    </div>
  );
}
