import { Search, CheckCheck, XCircle, RotateCcw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AttendanceFilters } from '@/features/dss/types';

interface Option { id: string; nome: string }

interface Props {
  searchInput: string;
  onSearchChange: (v: string) => void;
  filters: AttendanceFilters;
  onChange: (f: Partial<AttendanceFilters>) => void;
  setores: Option[];
  changedCount: number;
  onMarkAllPresent: () => void;
  onMarkAllAbsent: () => void;
  onRestore: () => void;
}

export function DssAttendanceFilters({
  searchInput, onSearchChange, filters, onChange, setores, changedCount, onMarkAllPresent, onMarkAllAbsent, onRestore,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou código..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
      </div>

      <Select value={filters.setorId} onValueChange={(v) => onChange({ setorId: v })}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Setor" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os setores</SelectItem>
          {setores.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.presenca} onValueChange={(v) => onChange({ presenca: v as AttendanceFilters['presenca'] })}>
        <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos</SelectItem>
          <SelectItem value="presentes">Presentes</SelectItem>
          <SelectItem value="ausentes">Ausentes</SelectItem>
        </SelectContent>
      </Select>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {changedCount > 0 && (
          <span className="rounded-full bg-status-warning/10 px-2.5 py-1 text-xs font-medium text-status-warning">{changedCount} alterado(s)</span>
        )}
        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={onMarkAllPresent}><CheckCheck className="h-3.5 w-3.5" /> Marcar todos presentes</Button>
        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={onMarkAllAbsent}><XCircle className="h-3.5 w-3.5" /> Marcar todos ausentes</Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1.5" onClick={onRestore} disabled={changedCount === 0}><RotateCcw className="h-3.5 w-3.5" /> Restaurar</Button>
      </div>
    </div>
  );
}
