import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DSS_LOCATION_STATUS_META } from '../domain/dssLocationStatus';
import type { DssLocationFilters, DssLocationStatusKind } from '../types/dss-location.types';

interface Props {
  filters: DssLocationFilters;
  onChange: (f: Partial<DssLocationFilters>) => void;
  onReset: () => void;
  searchInput: string;
  onSearchChange: (v: string) => void;
  activeCount: number;
}

const SITUACOES: DssLocationStatusKind[] = ['em_uso', 'sem_funcionarios', 'sem_historico', 'revisar'];
const UTIL_LABEL: Record<DssLocationFilters['utilizacao'], string> = {
  todos: 'Toda utilização', com_funcionarios: 'Com funcionários', sem_funcionarios: 'Sem funcionários', com_historico: 'Com histórico', sem_historico: 'Sem histórico',
};

export function DssLocationsFilters({ filters, onChange, onReset, searchInput, onSearchChange, activeCount }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou descrição..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        </div>
        <Select value={filters.utilizacao} onValueChange={(v) => onChange({ utilizacao: v as DssLocationFilters['utilizacao'] })}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Utilização" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Toda utilização</SelectItem>
            <SelectItem value="com_funcionarios">Com funcionários</SelectItem>
            <SelectItem value="sem_funcionarios">Sem funcionários</SelectItem>
            <SelectItem value="com_historico">Com histórico</SelectItem>
            <SelectItem value="sem_historico">Sem histórico</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.situacao} onValueChange={(v) => onChange({ situacao: v as DssLocationFilters['situacao'] })}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Situação" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todas as situações</SelectItem>{SITUACOES.map(s => <SelectItem key={s} value={s}>{DSS_LOCATION_STATUS_META[s].label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{activeCount} filtro(s) ativo(s)</span>
          {filters.utilizacao !== 'todos' && <Chip label={UTIL_LABEL[filters.utilizacao]} onClear={() => onChange({ utilizacao: 'todos' })} />}
          {filters.situacao !== 'todos' && <Chip label={DSS_LOCATION_STATUS_META[filters.situacao].label} onClear={() => onChange({ situacao: 'todos' })} />}
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
