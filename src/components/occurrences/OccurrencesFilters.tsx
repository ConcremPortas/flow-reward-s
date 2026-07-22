import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { OccurrenceFilters } from '@/features/occurrences/types';

interface Option { id: string; nome: string }

interface Props {
  searchInput: string;
  onSearchChange: (v: string) => void;
  filters: OccurrenceFilters;
  onChange: (f: Partial<OccurrenceFilters>) => void;
  onReset: () => void;
  activeFilterCount: number;
  setores: Option[];
  categorias: Option[];
  statusOptions: string[];
}

export function OccurrencesFilters({
  searchInput, onSearchChange, filters, onChange, onReset, activeFilterCount, setores, categorias, statusOptions,
}: Props) {
  const [open, setOpen] = useState(false);

  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (filters.setorId !== 'todos') chips.push({ key: 'set', label: filters.setorId === '__sem_setor__' ? 'Sem setor' : `Setor: ${setores.find((s) => s.id === filters.setorId)?.nome ?? ''}`, clear: () => onChange({ setorId: 'todos' }) });
  if (filters.categoriaId !== 'todos') chips.push({ key: 'cat', label: `Categoria: ${categorias.find((c) => c.id === filters.categoriaId)?.nome ?? ''}`, clear: () => onChange({ categoriaId: 'todos' }) });
  if (filters.status !== 'todos') chips.push({ key: 'sts', label: `Status: ${filters.status}`, clear: () => onChange({ status: 'todos' }) });
  if (filters.tipo !== 'todos') chips.push({ key: 'tip', label: filters.tipo === 'falta' ? 'Com faltas' : 'Com advertências', clear: () => onChange({ tipo: 'todos' }) });
  if (filters.somenteComOcorrencia) chips.push({ key: 'oco', label: 'Somente com ocorrência', clear: () => onChange({ somenteComOcorrencia: false }) });
  if (filters.somenteAlterados) chips.push({ key: 'alt', label: 'Somente alterados', clear: () => onChange({ somenteAlterados: false }) });
  if (filters.ocultarZerados) chips.push({ key: 'zer', label: 'Ocultar zerados', clear: () => onChange({ ocultarZerados: false }) });

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, código, função ou setor..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        </div>

        <Select value={filters.setorId} onValueChange={(v) => onChange({ setorId: v })}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Setor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os setores</SelectItem>
            <SelectItem value="__sem_setor__">⚠ Sem setor</SelectItem>
            {setores.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filters.status} onValueChange={(v) => onChange({ status: v })}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-1.5">
              <SlidersHorizontal className="h-4 w-4" />
              Filtros avançados
              {activeFilterCount > 0 && <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">{activeFilterCount}</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 space-y-4">
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
              <label className="text-xs font-medium text-muted-foreground">Tipo de ocorrência</label>
              <Select value={filters.tipo} onValueChange={(v) => onChange({ tipo: v as OccurrenceFilters['tipo'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Faltas e advertências</SelectItem>
                  <SelectItem value="falta">Somente faltas</SelectItem>
                  <SelectItem value="advertencia">Somente advertências</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3 border-t border-border/60 pt-3">
              <ToggleRow label="Somente com ocorrência" checked={filters.somenteComOcorrencia} onChange={(v) => onChange({ somenteComOcorrencia: v })} />
              <ToggleRow label="Somente alterados" checked={filters.somenteAlterados} onChange={(v) => onChange({ somenteAlterados: v })} />
              <ToggleRow label="Ocultar registros zerados" checked={filters.ocultarZerados} onChange={(v) => onChange({ ocultarZerados: v })} />
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

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-foreground">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
