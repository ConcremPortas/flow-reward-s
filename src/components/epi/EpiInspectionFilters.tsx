import { Search, CheckCheck, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { ComplianceFilters } from '@/features/epi/types/epi.types';

interface Option { id: string; nome: string }

interface Props {
  searchInput: string;
  onSearchChange: (v: string) => void;
  filters: ComplianceFilters;
  onChange: (f: Partial<ComplianceFilters>) => void;
  empresas: Option[];
  setores: Option[];
  changedCount: number;
  onMarkAllConforme: () => void;
  onRestore: () => void;
}

export function EpiInspectionFilters({
  searchInput, onSearchChange, filters, onChange, empresas, setores, changedCount, onMarkAllConforme, onRestore,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nome, código, setor ou função..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
      </div>

      <Select value={filters.empresaId} onValueChange={(v) => onChange({ empresaId: v })}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Empresa" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas as empresas</SelectItem>
          {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.setorId} onValueChange={(v) => onChange({ setorId: v })}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Setor" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os setores</SelectItem>
          {setores.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.situacao} onValueChange={(v) => onChange({ situacao: v as ComplianceFilters['situacao'] })}>
        <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas as situações</SelectItem>
          <SelectItem value="conformes">Conformes</SelectItem>
          <SelectItem value="nao_conformes">Não conformes</SelectItem>
        </SelectContent>
      </Select>

      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Checkbox checked={filters.somenteAlterados} onCheckedChange={(v) => onChange({ somenteAlterados: !!v })} />
        Somente alterados
      </label>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {changedCount > 0 && (
          <span className="rounded-full bg-status-warning/10 px-2.5 py-1 text-xs font-medium text-status-warning">{changedCount} alterado(s)</span>
        )}
        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={onMarkAllConforme}><CheckCheck className="h-3.5 w-3.5" /> Marcar todos conformes</Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={onRestore} disabled={changedCount === 0}><RotateCcw className="h-3.5 w-3.5" /> Restaurar</Button>
      </div>
    </div>
  );
}
