import { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { Button } from '@/components/ui/button';
import { EmployeesPagination } from '@/components/employees/EmployeesPagination';
import { formatCurrencyBRL } from '@/lib/formatters';
import { RewardsFinancialSummary } from './RewardsFinancialSummary';
import { RewardsDistribution } from './RewardsDistribution';
import { RewardsLossBreakdown } from './RewardsLossBreakdown';
import { RewardsPreviewFilters, DEFAULT_PREVIEW_FILTERS, type PreviewFilters } from './RewardsPreviewFilters';
import { RewardsPreviewTable } from './RewardsPreviewTable';
import { RewardCalculationDrawer } from './RewardCalculationDrawer';
import { RewardsExistingProcessing } from './RewardsExistingProcessing';
import { RewardsComparisonDialog } from './RewardsComparisonDialog';
import type { ComparisonResult, ExistingProcessing, RewardResult, RewardsPreview } from '../types/rewards-processing.types';

interface Props {
  preview: RewardsPreview;
  existings: ExistingProcessing[];
  getComparison: (baseId: string) => ComparisonResult;
  onBack: () => void;
  onNext: () => void;
}

export function RewardsPreviewStep({ preview, existings, getComparison, onBack, onNext }: Props) {
  const [filters, setFilters] = useState<PreviewFilters>(DEFAULT_PREVIEW_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<RewardResult | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);

  const allEmployees = useMemo(() => preview.bases.flatMap(b => b.employees), [preview]);
  const baseNomeByEmployee = useMemo(() => {
    const m = new Map<string, string>();
    for (const b of preview.bases) for (const e of b.employees) m.set(e.id, b.baseNome);
    return m;
  }, [preview]);

  const setores = useMemo(() => [...new Set(allEmployees.map(e => e.setor))].sort(), [allEmployees]);
  const categorias = useMemo(() => [...new Set(allEmployees.map(e => e.categoria))].sort(), [allEmployees]);
  const faixas = useMemo(() => [...new Set(allEmployees.map(e => e.faixa))].sort(), [allEmployees]);

  const filtered = useMemo(() => allEmployees.filter(e => {
    if (filters.search && !e.nome.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.setor !== 'todos' && e.setor !== filters.setor) return false;
    if (filters.categoria !== 'todos' && e.categoria !== filters.categoria) return false;
    if (filters.faixa !== 'todos' && e.faixa !== filters.faixa) return false;
    if (filters.somenteSemBonus && e.bonus_alcancado > 0) return false;
    return true;
  }), [allEmployees, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const paged = filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  const porCategoria = useMemo(() => {
    const m = new Map<string, { n: number; total: number }>();
    for (const e of allEmployees) {
      const cur = m.get(e.categoria) ?? { n: 0, total: 0 };
      cur.n += 1; cur.total += e.bonus_alcancado || 0;
      m.set(e.categoria, cur);
    }
    return [...m.entries()].map(([categoria, v]) => ({ categoria, ...v })).sort((a, b) => b.total - a.total);
  }, [allEmployees]);

  return (
    <div className="space-y-4">
      <RewardsFinancialSummary totals={preview.totals} />

      {existings.length > 0 && (
        <div className="space-y-3">
          {existings.map(ex => {
            const novo = preview.bases.find(b => b.baseId === ex.baseId)?.employees.reduce((s, e) => s + e.bonus_alcancado, 0) ?? 0;
            return <RewardsExistingProcessing key={ex.baseId} existing={ex} novoValor={novo} onCompare={() => setComparison(getComparison(ex.baseId))} />;
          })}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard title="Distribuição por faixa"><RewardsDistribution employees={allEmployees} /></SectionCard>
        <SectionCard title="Análise por critério" description="Baseada nas notas reais — sem decomposição financeira artificial."><RewardsLossBreakdown employees={allEmployees} /></SectionCard>
      </div>

      {categorias.length > 1 && (
        <SectionCard title="Prévia por categoria">
          <div className="overflow-x-auto rounded-lg border border-border/70">
            <table className="w-full text-sm">
              <thead><tr className="bg-muted/50 text-left text-xs text-muted-foreground">
                <th className="px-3 py-2 font-medium">Categoria</th><th className="px-3 py-2 text-right font-medium">Funcionários</th>
                <th className="px-3 py-2 text-right font-medium">Valor total</th><th className="px-3 py-2 text-right font-medium">Valor médio</th>
              </tr></thead>
              <tbody>
                {porCategoria.map(c => (
                  <tr key={c.categoria} className="border-t border-border/50">
                    <td className="px-3 py-2 font-medium text-foreground">{c.categoria}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{c.n}</td>
                    <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatCurrencyBRL(c.total)}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{formatCurrencyBRL(c.n ? c.total / c.n : 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Funcionários calculados" description="Clique em um funcionário para ver a memória de cálculo.">
        <div className="space-y-4">
          <RewardsPreviewFilters filters={filters} onChange={(f) => { setFilters(prev => ({ ...prev, ...f })); setPage(1); }} setores={setores} categorias={categorias} faixas={faixas} />
          <RewardsPreviewTable rows={paged} onOpen={setSelected} />
          <EmployeesPagination page={clampedPage} totalPages={totalPages} pageSize={pageSize} total={filtered.length} onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }} />
        </div>
      </SectionCard>

      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-1.5" onClick={onBack}><ArrowLeft className="h-4 w-4" /> Validação</Button>
        <Button className="gap-1.5" onClick={onNext}>Revisar e confirmar <ArrowRight className="h-4 w-4" /></Button>
      </div>

      <RewardCalculationDrawer employee={selected} baseNome={selected ? (baseNomeByEmployee.get(selected.id) ?? '') : ''} competencia={preview.competencia} onClose={() => setSelected(null)} />
      <RewardsComparisonDialog open={!!comparison} onOpenChange={(o) => { if (!o) setComparison(null); }} comparison={comparison} />
    </div>
  );
}
