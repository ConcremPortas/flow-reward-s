import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { DashboardFilters as Filters, FilterOption } from '@/features/dashboard/types';
import { CompetenciaPicker } from './CompetenciaPicker';

interface DashboardFiltersProps {
  filters: Filters;
  options: { unidades: FilterOption[]; setores: FilterOption[]; gestores: FilterOption[] };
  onChange: (f: Partial<Filters>) => void;
}

/** Barra de filtros compacta — controla todos os blocos da tela. */
export function DashboardFilters({ filters, options, onChange }: DashboardFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Field label="Competência">
        <CompetenciaPicker value={filters.competencia} onChange={(v) => onChange({ competencia: v })} />
      </Field>
      <Field label="Unidade">
        <Select value={filters.unidadeId} onValueChange={(v) => onChange({ unidadeId: v, setorId: 'all' })}>
          <SelectTrigger className="h-8 w-[150px] text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as unidades</SelectItem>
            {options.unidades.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Setor">
        <Select value={filters.setorId} onValueChange={(v) => onChange({ setorId: v })}>
          <SelectTrigger className="h-8 w-[150px] text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os setores</SelectItem>
            {options.setores.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Gestor">
        <Select value={filters.gestorId} onValueChange={(v) => onChange({ gestorId: v })}>
          <SelectTrigger className="h-8 w-[150px] text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os gestores</SelectItem>
            {options.gestores.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>
      <Field label="Comparar">
        <Select value={filters.compare} onValueChange={(v) => onChange({ compare: v as Filters['compare'] })}>
          <SelectTrigger className="h-8 w-[140px] text-[13px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="prev-month">Mês anterior</SelectItem>
            <SelectItem value="prev-year">Ano anterior</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
