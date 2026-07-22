import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TIER_STATUS_META } from '../domain/bonusTierRegistrationStatus';
import type { BonusTierFilters, TierRegistrationStatusKind } from '../types/bonus-tier.types';

interface Props {
  filters: BonusTierFilters;
  onChange: (f: Partial<BonusTierFilters>) => void;
  onReset: () => void;
  searchInput: string;
  onSearchChange: (v: string) => void;
  activeCount: number;
}

const SITUACOES: TierRegistrationStatusKind[] = ['regular', 'revisar', 'sem_vinculo'];

export function BonusTiersFilters({ filters, onChange, onReset, searchInput, onSearchChange, activeCount }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou valor..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        </div>
        <Select value={filters.utilizacao} onValueChange={(v) => onChange({ utilizacao: v as BonusTierFilters['utilizacao'] })}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Utilização" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Toda utilização</SelectItem><SelectItem value="em_uso">Em uso</SelectItem><SelectItem value="sem_vinculo">Sem vínculo</SelectItem></SelectContent>
        </Select>
        <Select value={filters.situacao} onValueChange={(v) => onChange({ situacao: v as BonusTierFilters['situacao'] })}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Situação" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todas situações</SelectItem>{SITUACOES.map(s => <SelectItem key={s} value={s}>{TIER_STATUS_META[s].label}</SelectItem>)}</SelectContent>
        </Select>
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Checkbox checked={filters.valorZero} onCheckedChange={(v) => onChange({ valorZero: !!v })} /> Valor zero
        </label>
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Checkbox checked={filters.comDivergencia} onCheckedChange={(v) => onChange({ comDivergencia: !!v })} /> Com divergência
        </label>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{activeCount} filtro(s) ativo(s)</span>
          {filters.utilizacao !== 'todos' && <Chip label={filters.utilizacao === 'em_uso' ? 'Em uso' : 'Sem vínculo'} onClear={() => onChange({ utilizacao: 'todos' })} />}
          {filters.situacao !== 'todos' && <Chip label={TIER_STATUS_META[filters.situacao].label} onClear={() => onChange({ situacao: 'todos' })} />}
          {filters.valorZero && <Chip label="Valor zero" onClear={() => onChange({ valorZero: false })} />}
          {filters.comDivergencia && <Chip label="Com divergência" onClear={() => onChange({ comDivergencia: false })} />}
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onReset}>Limpar filtros</Button>
        </div>
      )}
    </div>
  );
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
      {label}
      <button type="button" onClick={onClear} aria-label={`Remover filtro ${label}`} className="hover:text-primary/70"><X className="h-3 w-3" /></button>
    </span>
  );
}
