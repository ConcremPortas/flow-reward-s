import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompetenciaPicker } from '@/components/dashboard/CompetenciaPicker';
import type { BasePremiacao } from '@/hooks/useBasePremiacao';
import type { ProcessingsFilters } from '../hooks/useRewardsProcessings';

interface Props {
  filters: ProcessingsFilters;
  onChange: (f: Partial<ProcessingsFilters>) => void;
  searchInput: string;
  onSearchChange: (v: string) => void;
  bases: BasePremiacao[];
  categorias: string[];
}

export function RewardsProcessingFilters({ filters, onChange, searchInput, onSearchChange, bases, categorias }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-[180px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar base ou categoria..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
      </div>
      <CompetenciaPicker value={filters.competencia} onChange={(v) => onChange({ competencia: v })} className="w-[150px]" />
      <Select value={filters.baseId} onValueChange={(v) => onChange({ baseId: v })}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Base" /></SelectTrigger>
        <SelectContent><SelectItem value="todos">Todas as bases</SelectItem>{bases.map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={filters.categoria} onValueChange={(v) => onChange({ categoria: v })}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
        <SelectContent><SelectItem value="todos">Todas as categorias</SelectItem>{categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
      </Select>
      <div className="flex items-center gap-1.5">
        <Input type="date" value={filters.processadoInicio} onChange={(e) => onChange({ processadoInicio: e.target.value })} className="w-[150px]" aria-label="Processado de" />
        <span className="text-xs text-muted-foreground">até</span>
        <Input type="date" value={filters.processadoFim} onChange={(e) => onChange({ processadoFim: e.target.value })} className="w-[150px]" aria-label="Processado até" />
      </div>
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Checkbox checked={filters.somenteInconsistencias} onCheckedChange={(v) => onChange({ somenteInconsistencias: !!v })} /> Com inconsistência
      </label>
    </div>
  );
}
