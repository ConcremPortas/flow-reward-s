import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { JobsSalariesFilters as Filtros } from '../types/jobsSalaries.types';
import type { FilterOptions } from '../domain/model';

const TODOS = '__todos__';

interface Props {
  filtros: Filtros;
  options: FilterOptions;
  ativos: number;
  onChange: (f: Partial<Filtros>) => void;
  onLimpar: () => void;
}

const STATUS_LABEL: Record<Filtros['status'], string> = {
  ativos: 'Ativos',
  inativos: 'Inativos',
  todos: 'Todos os status',
};

/** Barra de filtros globais + chips ativos. Os filtros persistem na URL. */
export function JobsSalariesFilters({ filtros, options, ativos, onChange, onLimpar }: Props) {
  const setorNome = options.setores.find((s) => s.id === filtros.setorId)?.nome;
  const cargoNome = options.cargos.find((c) => c.id === filtros.cargoId)?.nome;

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por cargo ou colaborador..."
            value={filtros.busca}
            onChange={(e) => onChange({ busca: e.target.value })}
            className="pl-9"
          />
        </div>

        <Select value={filtros.setorId ?? TODOS} onValueChange={(v) => onChange({ setorId: v === TODOS ? null : v })}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Setor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os setores</SelectItem>
            {options.setores.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filtros.nivel ?? TODOS} onValueChange={(v) => onChange({ nivel: v === TODOS ? null : v })}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Nível" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os níveis</SelectItem>
            {options.niveis.map((n) => <SelectItem key={n} value={n}>{`Nível ${n}`}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filtros.cargoId ?? TODOS} onValueChange={(v) => onChange({ cargoId: v === TODOS ? null : v })}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Cargo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os cargos</SelectItem>
            {options.cargos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filtros.status} onValueChange={(v) => onChange({ status: v as Filtros['status'] })}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="inativos">Inativos</SelectItem>
            <SelectItem value="todos">Todos os status</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {ativos > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{ativos} filtro(s) ativo(s)</span>
          {setorNome && <Chip label={setorNome} onClear={() => onChange({ setorId: null })} />}
          {filtros.nivel && <Chip label={`Nível ${filtros.nivel}`} onClear={() => onChange({ nivel: null })} />}
          {cargoNome && <Chip label={cargoNome} onClear={() => onChange({ cargoId: null })} />}
          {filtros.status !== 'ativos' && <Chip label={STATUS_LABEL[filtros.status]} onClear={() => onChange({ status: 'ativos' })} />}
          {filtros.busca.trim() !== '' && <Chip label={`"${filtros.busca.trim()}"`} onClear={() => onChange({ busca: '' })} />}
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onLimpar}>Limpar filtros</Button>
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
