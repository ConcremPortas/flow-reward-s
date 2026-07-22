import { useMemo } from 'react';
import { Grid3x3, Check, AlertTriangle, Copy, Plus } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { buildCoverage, coverageCounts, cellAt } from '../domain/rewardFormulaCoverage';
import { RewardFormulaCoverageCell } from '../components/RewardFormulaCoverageCell';
import { RewardFormulasEmptyState } from '../components/RewardFormulasEmptyState';
import type { CoverageCell, RewardFormulaRow } from '../types/reward-formula.types';

interface Option { id: string; nome: string }
interface Props {
  rows: RewardFormulaRow[];
  categorias: Option[];
  bases: Option[];
  onCellClick: (cell: CoverageCell) => void;
}

export function RewardFormulaCoverageView({ rows, categorias, bases, onCellClick }: Props) {
  const coverage = useMemo(() => buildCoverage(categorias, bases, rows), [categorias, bases, rows]);
  const counts = useMemo(() => coverageCounts(coverage), [coverage]);

  if (categorias.length === 0 || bases.length === 0) {
    return <RewardFormulasEmptyState icon={Grid3x3} title="Matriz indisponível" description="Cadastre categorias e bases de premiação para visualizar a cobertura." />;
  }

  return (
    <div className="space-y-[18px]">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard title="Configuradas" value={String(counts.configuradas)} icon={Check} status="positive" />
        <StatCard title="Sem fórmula" value={String(counts.semFormula)} icon={Plus} status={counts.semFormula > 0 ? 'warning' : 'positive'} />
        <StatCard title="Incompletas" value={String(counts.incompletas)} icon={AlertTriangle} status={counts.incompletas > 0 ? 'critical' : 'positive'} />
        <StatCard title="Duplicadas" value={String(counts.duplicadas)} icon={Copy} status={counts.duplicadas > 0 ? 'warning' : 'positive'} />
      </div>

      <SectionCard title="Cobertura Categoria × Base" description="Clique numa célula: configurada abre a fórmula; sem fórmula cria; duplicada compara.">
        {/* Desktop/tablet — matriz */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-card px-2 py-1 text-left text-xs font-medium text-muted-foreground">Categoria \ Base</th>
                {bases.map(b => <th key={b.id} className="px-2 py-1 text-center text-xs font-medium text-foreground">{b.nome}</th>)}
              </tr>
            </thead>
            <tbody>
              {categorias.map(cat => (
                <tr key={cat.id}>
                  <td className="sticky left-0 z-10 bg-card px-2 py-1 text-sm font-medium text-foreground">{cat.nome}</td>
                  {bases.map(base => {
                    const cell = cellAt(coverage, cat.id, base.id)!;
                    return <td key={base.id} className="min-w-[120px] p-0"><RewardFormulaCoverageCell cell={cell} onClick={() => onCellClick(cell)} /></td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile — lista Categoria → Bases */}
        <div className="space-y-3 sm:hidden">
          {categorias.map(cat => (
            <div key={cat.id} className="rounded-xl border border-border/70 p-3">
              <p className="mb-2 text-sm font-medium text-foreground">{cat.nome}</p>
              <div className="space-y-1.5">
                {bases.map(base => {
                  const cell = cellAt(coverage, cat.id, base.id)!;
                  return (
                    <div key={base.id} className="flex items-center gap-2">
                      <span className="w-28 shrink-0 truncate text-xs text-muted-foreground">{base.nome}</span>
                      <div className="flex-1"><RewardFormulaCoverageCell cell={cell} onClick={() => onCellClick(cell)} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
