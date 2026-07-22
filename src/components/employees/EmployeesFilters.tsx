import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ELIGIBILITY_LABEL } from '@/features/employees/domain/employeeEligibility';
import type { EligibilityStatus, EmployeeFilters } from '@/features/employees/types';

interface Option { id: string; nome: string }

interface EmployeesFiltersProps {
  searchInput: string;
  onSearchChange: (v: string) => void;
  filters: EmployeeFilters;
  onChange: (f: Partial<EmployeeFilters>) => void;
  onReset: () => void;
  activeFilterCount: number;
  empresas: Option[];
  setores: Option[];
  funcoes: Option[];
  categorias: Option[];
  locaisDSS?: Option[];
  statusOptions: string[];
}

const ELIGIBILITY_OPTIONS: EligibilityStatus[] = ['elegivel', 'pendente', 'nao_elegivel', 'fora_premiacao'];

export function EmployeesFilters({
  searchInput, onSearchChange, filters, onChange, onReset, activeFilterCount,
  empresas, setores, funcoes, categorias, locaisDSS = [], statusOptions,
}: EmployeesFiltersProps) {
  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.empresaId !== 'todos') chips.push({ key: 'emp', label: `Empresa: ${empresas.find((e) => e.id === filters.empresaId)?.nome ?? ''}`, clear: () => onChange({ empresaId: 'todos' }) });
  if (filters.setorId !== 'todos') chips.push({ key: 'set', label: filters.setorId === '__sem_setor__' ? 'Sem setor' : `Setor: ${setores.find((s) => s.id === filters.setorId)?.nome ?? ''}`, clear: () => onChange({ setorId: 'todos' }) });
  if (filters.funcaoId !== 'todos') chips.push({ key: 'fun', label: `Função: ${funcoes.find((f) => f.id === filters.funcaoId)?.nome ?? ''}`, clear: () => onChange({ funcaoId: 'todos' }) });
  if (filters.categoriaId !== 'todos') chips.push({ key: 'cat', label: `Categoria: ${categorias.find((c) => c.id === filters.categoriaId)?.nome ?? ''}`, clear: () => onChange({ categoriaId: 'todos' }) });
  if (filters.localDssId !== 'todos') chips.push({ key: 'dss', label: filters.localDssId === '__sem_local__' ? 'Sem local de DSS' : `Local DSS: ${locaisDSS.find((l) => l.id === filters.localDssId)?.nome ?? ''}`, clear: () => onChange({ localDssId: 'todos' }) });
  if (filters.status !== 'todos') chips.push({ key: 'sts', label: `Status: ${filters.status}`, clear: () => onChange({ status: 'todos' }) });
  if (filters.eligibility !== 'todos') chips.push({ key: 'elg', label: `Premiação: ${ELIGIBILITY_LABEL[filters.eligibility]}`, clear: () => onChange({ eligibility: 'todos' }) });

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, código, setor, função, categoria ou empresa..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        </div>

        <Select value={filters.empresaId} onValueChange={(v) => onChange({ empresaId: v })}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Empresa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as empresas</SelectItem>
            {empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.setorId} onValueChange={(v) => onChange({ setorId: v })}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Setor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os setores</SelectItem>
            <SelectItem value="__sem_setor__">⚠ Sem setor</SelectItem>
            {setores.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(v) => onChange({ status: v })}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-1.5">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros avançados
              {activeFilterCount > 0 && <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">{activeFilterCount}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-72 space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Função</label>
              <Select value={filters.funcaoId} onValueChange={(v) => onChange({ funcaoId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as funções</SelectItem>
                  {funcoes.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Categoria</label>
              <Select value={filters.categoriaId} onValueChange={(v) => onChange({ categoriaId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as categorias</SelectItem>
                  {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Local de DSS</label>
              <Select value={filters.localDssId} onValueChange={(v) => onChange({ localDssId: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os locais</SelectItem>
                  <SelectItem value="__sem_local__">⚠ Sem local de DSS</SelectItem>
                  {locaisDSS.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Elegibilidade para premiação</label>
              <Select value={filters.eligibility} onValueChange={(v) => onChange({ eligibility: v as EligibilityStatus | 'todos' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  {ELIGIBILITY_OPTIONS.map((e) => <SelectItem key={e} value={e}>{ELIGIBILITY_LABEL[e]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {chips.map((c) => (
            <span key={c.key} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">
              {c.label}
              <button type="button" onClick={c.clear} aria-label="Remover filtro" className="text-muted-foreground hover:text-foreground"><X className="h-3 w-3" /></button>
            </span>
          ))}
          <button type="button" onClick={onReset} className="text-xs font-medium text-muted-foreground hover:text-foreground">Limpar filtros</button>
        </div>
      )}
    </div>
  );
}
