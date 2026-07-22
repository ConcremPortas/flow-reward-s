import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { CategoryFilters } from '../types/category.types';

interface Props {
  filters: CategoryFilters;
  onChange: (f: Partial<CategoryFilters>) => void;
  onReset: () => void;
  searchInput: string;
  onSearchChange: (v: string) => void;
  activeCount: number;
}

const UTIL_LABEL: Record<CategoryFilters['utilizacao'], string> = {
  todos: 'Toda utilização', em_uso: 'Em uso', sem_funcionarios: 'Sem funcionários', em_premiacao: 'Usada em premiação',
};

export function CategoriesFilters({ filters, onChange, onReset, searchInput, onSearchChange, activeCount }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, base ou setor..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        </div>
        <Select value={filters.utilizacao} onValueChange={(v) => onChange({ utilizacao: v as CategoryFilters['utilizacao'] })}>
          <SelectTrigger className="w-[190px]"><SelectValue placeholder="Utilização" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Toda utilização</SelectItem>
            <SelectItem value="em_uso">Em uso</SelectItem>
            <SelectItem value="sem_funcionarios">Sem funcionários</SelectItem>
            <SelectItem value="em_premiacao">Usada em premiação</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{activeCount} filtro(s) ativo(s)</span>
          {filters.utilizacao !== 'todos' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {UTIL_LABEL[filters.utilizacao]}
              <button type="button" onClick={() => onChange({ utilizacao: 'todos' })} aria-label="Remover filtro" className="hover:text-primary/70"><X className="h-3 w-3" /></button>
            </span>
          )}
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onReset}>Limpar filtros</Button>
        </div>
      )}
    </div>
  );
}
