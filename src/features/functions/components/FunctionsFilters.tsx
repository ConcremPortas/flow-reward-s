import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FUNCTION_STATUS_META } from '../domain/functionRegistrationStatus';
import type { FunctionFilters, FunctionStatusKind } from '../types/function.types';
import type { SetorOption } from '../hooks/useFunctions';

interface Props {
  filters: FunctionFilters;
  onChange: (f: Partial<FunctionFilters>) => void;
  onReset: () => void;
  searchInput: string;
  onSearchChange: (v: string) => void;
  activeCount: number;
  setores: SetorOption[];
}

const SITUACOES: FunctionStatusKind[] = ['regular', 'revisar', 'possivel_correspondencia'];
const UTIL_LABEL: Record<FunctionFilters['utilizacao'], string> = {
  todos: 'Toda utilização', em_uso: 'Em uso', sem_vinculo: 'Sem vínculo', somente_historico: 'Somente histórico',
};

export function FunctionsFilters({ filters, onChange, onReset, searchInput, onSearchChange, activeCount, setores }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou setor..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        </div>
        <Select value={filters.utilizacao} onValueChange={(v) => onChange({ utilizacao: v as FunctionFilters['utilizacao'] })}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Utilização" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Toda utilização</SelectItem>
            <SelectItem value="em_uso">Em uso</SelectItem>
            <SelectItem value="sem_vinculo">Sem vínculo</SelectItem>
            <SelectItem value="somente_historico">Somente histórico</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.setorId} onValueChange={(v) => onChange({ setorId: v })}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Setor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os setores</SelectItem>
            {setores.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filters.situacao} onValueChange={(v) => onChange({ situacao: v as FunctionFilters['situacao'] })}>
          <SelectTrigger className="w-[190px]"><SelectValue placeholder="Situação" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todas as situações</SelectItem>{SITUACOES.map(s => <SelectItem key={s} value={s}>{FUNCTION_STATUS_META[s].label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{activeCount} filtro(s) ativo(s)</span>
          {filters.utilizacao !== 'todos' && <Chip label={UTIL_LABEL[filters.utilizacao]} onClear={() => onChange({ utilizacao: 'todos' })} />}
          {filters.setorId !== 'todos' && <Chip label={`Setor: ${setores.find(s => s.id === filters.setorId)?.nome ?? ''}`} onClear={() => onChange({ setorId: 'todos' })} />}
          {filters.situacao !== 'todos' && <Chip label={FUNCTION_STATUS_META[filters.situacao].label} onClear={() => onChange({ situacao: 'todos' })} />}
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
