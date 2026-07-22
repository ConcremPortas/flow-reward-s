import { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DashboardFilters } from './DashboardFilters';
import { CompetenciaPicker } from './CompetenciaPicker';
import type { DashboardFilters as Filters, FilterOption } from '@/features/dashboard/types';

interface Props {
  filters: Filters;
  options: { unidades: FilterOption[]; setores: FilterOption[]; gestores: FilterOption[] };
  onChange: (f: Partial<Filters>) => void;
  onReset: () => void;
}

const labelOf = (opts: FilterOption[], v: string) => opts.find((o) => o.value === v)?.label ?? v;

/** Barra de filtros recolhível com chips dos filtros ativos e contador "Filtros N". */
export function AnalyticsFilterBar({ filters, options, onChange, onReset }: Props) {
  const [open, setOpen] = useState(false);

  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.unidadeId !== 'all') chips.push({ key: 'un', label: `Unidade: ${labelOf(options.unidades, filters.unidadeId)}`, clear: () => onChange({ unidadeId: 'all', setorId: 'all' }) });
  if (filters.setorId !== 'all') chips.push({ key: 'se', label: `Setor: ${labelOf(options.setores, filters.setorId)}`, clear: () => onChange({ setorId: 'all' }) });
  if (filters.gestorId !== 'all') chips.push({ key: 'ge', label: `Gestor: ${labelOf(options.gestores, filters.gestorId)}`, clear: () => onChange({ gestorId: 'all' }) });
  if (filters.compare !== 'prev-month') chips.push({ key: 'cp', label: 'Comparar: ano anterior', clear: () => onChange({ compare: 'prev-month' }) });
  const activeCount = chips.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Competência sempre visível */}
        <CompetenciaPicker value={filters.competencia} onChange={(v) => onChange({ competencia: v })} />

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-medium transition-colors',
            activeCount > 0 ? 'border-primary/30 bg-primary/[0.06] text-primary' : 'border-border bg-card text-muted-foreground hover:text-foreground',
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros{activeCount > 0 ? ` · ${activeCount}` : ''}
          <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open ? 'rotate-180' : '')} />
        </button>

        {/* Chips ativos */}
        {chips.map((c) => (
          <span key={c.key} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
            {c.label}
            <button type="button" onClick={c.clear} className="text-muted-foreground hover:text-foreground" aria-label="Remover filtro"><X className="h-3 w-3" /></button>
          </span>
        ))}
        {activeCount > 0 && (
          <button type="button" onClick={onReset} className="text-xs font-medium text-muted-foreground hover:text-foreground">Limpar</button>
        )}
      </div>

      {open && (
        <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
          <DashboardFilters filters={filters} options={options} onChange={onChange} />
        </div>
      )}
    </div>
  );
}
