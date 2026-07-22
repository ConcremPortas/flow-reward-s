import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Empresa } from '@/hooks/useEmpresas';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { STATUS_META } from '../domain/sectorRegistrationStatus';
import { SEM_LIDERANCA } from '../domain/sectorFilters';
import type { SectorFilters, RegistrationStatusKind } from '../types/sector.types';

interface Props {
  filters: SectorFilters;
  onChange: (f: Partial<SectorFilters>) => void;
  onReset: () => void;
  searchInput: string;
  onSearchChange: (v: string) => void;
  empresas: Empresa[];
  supervisores: Funcionario[];
  encarregados: Funcionario[];
  activeCount: number;
}

const SITUACOES: RegistrationStatusKind[] = ['completo', 'atencao', 'pendente'];

export function SectorsFilters({ filters, onChange, onReset, searchInput, onSearchChange, empresas, supervisores, encarregados, activeCount }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar setor, empresa ou liderança..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        </div>
        <Select value={filters.empresaId} onValueChange={(v) => onChange({ empresaId: v })}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Empresa" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todas as empresas</SelectItem>{empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.supervisorId} onValueChange={(v) => onChange({ supervisorId: v })}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Supervisor" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos supervisores</SelectItem><SelectItem value={SEM_LIDERANCA}>Sem supervisor</SelectItem>{supervisores.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.encarregadoId} onValueChange={(v) => onChange({ encarregadoId: v })}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Encarregado" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos encarregados</SelectItem><SelectItem value={SEM_LIDERANCA}>Sem encarregado</SelectItem>{encarregados.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.situacao} onValueChange={(v) => onChange({ situacao: v as SectorFilters['situacao'] })}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Situação" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todas situações</SelectItem>{SITUACOES.map(s => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{activeCount} filtro(s) ativo(s)</span>
          {filters.empresaId !== 'todos' && <Chip label={empresas.find(e => e.id === filters.empresaId)?.nome ?? 'Empresa'} onClear={() => onChange({ empresaId: 'todos' })} />}
          {filters.supervisorId !== 'todos' && <Chip label={filters.supervisorId === SEM_LIDERANCA ? 'Sem supervisor' : (supervisores.find(f => f.id === filters.supervisorId)?.nome ?? 'Supervisor')} onClear={() => onChange({ supervisorId: 'todos' })} />}
          {filters.encarregadoId !== 'todos' && <Chip label={filters.encarregadoId === SEM_LIDERANCA ? 'Sem encarregado' : (encarregados.find(f => f.id === filters.encarregadoId)?.nome ?? 'Encarregado')} onClear={() => onChange({ encarregadoId: 'todos' })} />}
          {filters.situacao !== 'todos' && <Chip label={STATUS_META[filters.situacao].label} onClear={() => onChange({ situacao: 'todos' })} />}
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
