import { Database, Users, Building2, Layers, Tag } from 'lucide-react';
import type { FinancialTotals } from '../types/rewards-report.types';

/** Faixa secundária de cobertura — rótulos semanticamente corretos (resultados ≠ funcionários). */
export function RewardsCoverageSummary({ totals }: { totals: FinancialTotals }) {
  const items = [
    { icon: Database, label: 'Resultados analisados', value: totals.resultados, hint: 'vínculos (linhas)' },
    { icon: Users, label: 'Funcionários únicos', value: totals.funcionariosUnicos, hint: 'pessoas distintas' },
    { icon: Building2, label: 'Setores', value: totals.setores },
    { icon: Layers, label: 'Bases', value: totals.bases },
    { icon: Tag, label: 'Categorias', value: totals.categorias },
  ];
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-border/70 bg-muted/20 px-4 py-2.5">
      {items.map(i => (
        <div key={i.label} className="flex items-center gap-2">
          <i.icon className="h-4 w-4 text-muted-foreground/60" />
          <span className="text-sm"><b className="tabular-nums text-foreground">{i.value}</b> <span className="text-muted-foreground">{i.label}</span>{i.hint && <span className="text-xs text-muted-foreground/70"> · {i.hint}</span>}</span>
        </div>
      ))}
    </div>
  );
}
