import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GENERAL_INDICATOR_TYPE_STATUS_META } from '../domain/generalIndicatorTypeStatus';
import type { GeneralIndicatorTypeFilters, GeneralIndicatorTypeStatusKind } from '../types/general-indicator-type.types';

interface Props {
  filters: GeneralIndicatorTypeFilters;
  onChange: (f: Partial<GeneralIndicatorTypeFilters>) => void;
  onReset: () => void;
  searchInput: string;
  onSearchChange: (v: string) => void;
  activeCount: number;
}

const SITUACOES: GeneralIndicatorTypeStatusKind[] = ['regular', 'sem_medicoes', 'revisar', 'config_incompleta'];
const STATUS_LABEL: Record<GeneralIndicatorTypeFilters['status'], string> = { todos: 'Todos', ativo: 'Ativo', inativo: 'Inativo' };
const UTIL_LABEL: Record<GeneralIndicatorTypeFilters['utilizacao'], string> = { todos: 'Toda utilização', com_medicao: 'Com medição', sem_medicao: 'Sem medição' };

export function GeneralIndicatorTypesFilters({ filters, onChange, onReset, searchInput, onSearchChange, activeCount }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por código, nome ou descrição..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        </div>
        <Select value={filters.status} onValueChange={(v) => onChange({ status: v as GeneralIndicatorTypeFilters['status'] })}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos</SelectItem><SelectItem value="ativo">Ativo</SelectItem><SelectItem value="inativo">Inativo</SelectItem></SelectContent>
        </Select>
        <Select value={filters.utilizacao} onValueChange={(v) => onChange({ utilizacao: v as GeneralIndicatorTypeFilters['utilizacao'] })}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Utilização" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Toda utilização</SelectItem><SelectItem value="com_medicao">Com medição</SelectItem><SelectItem value="sem_medicao">Sem medição</SelectItem></SelectContent>
        </Select>
        <Select value={filters.situacao} onValueChange={(v) => onChange({ situacao: v as GeneralIndicatorTypeFilters['situacao'] })}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder="Situação" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todas as situações</SelectItem>{SITUACOES.map(s => <SelectItem key={s} value={s}>{GENERAL_INDICATOR_TYPE_STATUS_META[s].label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{activeCount} filtro(s) ativo(s)</span>
          {filters.status !== 'todos' && <Chip label={STATUS_LABEL[filters.status]} onClear={() => onChange({ status: 'todos' })} />}
          {filters.utilizacao !== 'todos' && <Chip label={UTIL_LABEL[filters.utilizacao]} onClear={() => onChange({ utilizacao: 'todos' })} />}
          {filters.situacao !== 'todos' && <Chip label={GENERAL_INDICATOR_TYPE_STATUS_META[filters.situacao].label} onClear={() => onChange({ situacao: 'todos' })} />}
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
