import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PERFIL_LABEL, CREATABLE_PERFIS } from '../domain/permissionDefinitions';
import type { UserFilters } from '../types/user.types';

interface Props {
  filters: UserFilters;
  onChange: (f: Partial<UserFilters>) => void;
  onReset: () => void;
  searchInput: string;
  onSearchChange: (v: string) => void;
  activeCount: number;
}

const ACESSO_LABEL: Record<UserFilters['acesso'], string> = {
  todos: 'Todo acesso', total: 'Acesso total', personalizado: 'Personalizado', sem_acesso: 'Sem acesso', desconhecida: 'A revisar',
};

export function UsersFilters({ filters, onChange, onReset, searchInput, onSearchChange, activeCount }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, e-mail, perfil ou seção..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        </div>
        <Select value={filters.perfil} onValueChange={(v) => onChange({ perfil: v })}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Perfil" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos os perfis</SelectItem>{CREATABLE_PERFIS.map(p => <SelectItem key={p} value={p}>{PERFIL_LABEL[p]}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(v) => onChange({ status: v as UserFilters['status'] })}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos os status</SelectItem><SelectItem value="ativo">Ativos</SelectItem><SelectItem value="inativo">Inativos</SelectItem></SelectContent>
        </Select>
        <Select value={filters.acesso} onValueChange={(v) => onChange({ acesso: v as UserFilters['acesso'] })}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Acesso" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo acesso</SelectItem>
            <SelectItem value="total">Acesso total</SelectItem>
            <SelectItem value="personalizado">Personalizado</SelectItem>
            <SelectItem value="sem_acesso">Sem acesso</SelectItem>
            <SelectItem value="desconhecida">A revisar</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{activeCount} filtro(s) ativo(s)</span>
          {filters.perfil !== 'todos' && <Chip label={PERFIL_LABEL[filters.perfil as keyof typeof PERFIL_LABEL] ?? filters.perfil} onClear={() => onChange({ perfil: 'todos' })} />}
          {filters.status !== 'todos' && <Chip label={filters.status === 'ativo' ? 'Ativos' : 'Inativos'} onClear={() => onChange({ status: 'todos' })} />}
          {filters.acesso !== 'todos' && <Chip label={ACESSO_LABEL[filters.acesso]} onClear={() => onChange({ acesso: 'todos' })} />}
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
