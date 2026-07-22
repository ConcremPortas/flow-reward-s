import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SITUACAO_META } from '../domain/indicatorStatus';
import { countActiveFilters } from '../domain/indicatorFilters';
import type { SectorIndicatorFilters, IndicatorSituacao } from '../types/sector-indicators.types';

interface Option { id: string; nome: string }

interface Props {
  searchInput: string;
  onSearchChange: (v: string) => void;
  filters: SectorIndicatorFilters;
  onChange: (f: Partial<SectorIndicatorFilters>) => void;
  onReset: () => void;
  empresas: Option[];
  setores: Option[];
}

const SITUACOES: IndicatorSituacao[] = ['superada', 'proxima', 'abaixo', 'pendente', 'sem_medicao'];

export function SectorIndicatorsFilters({ searchInput, onSearchChange, filters, onChange, onReset, empresas, setores }: Props) {
  const active = countActiveFilters(filters);

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por setor..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
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

        <Select value={filters.situacao} onValueChange={(v) => onChange({ situacao: v as SectorIndicatorFilters['situacao'] })}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Situação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as situações</SelectItem>
            {SITUACOES.map((s) => <SelectItem key={s} value={s}>{SITUACAO_META[s].label}</SelectItem>)}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Checkbox checked={filters.somentePendentes} onCheckedChange={(v) => onChange({ somentePendentes: !!v })} />
          Pendentes
        </label>
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Checkbox checked={filters.somenteAlterados} onCheckedChange={(v) => onChange({ somenteAlterados: !!v })} />
          Alterados
        </label>
        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Checkbox checked={filters.semMedicao} onCheckedChange={(v) => onChange({ semMedicao: !!v })} />
          Sem medição
        </label>
      </div>

      {active > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{active} filtro(s) ativo(s)</span>
          {filters.somentePendentes && <Chip label="Pendentes" onClear={() => onChange({ somentePendentes: false })} />}
          {filters.somenteAlterados && <Chip label="Alterados" onClear={() => onChange({ somenteAlterados: false })} />}
          {filters.semMedicao && <Chip label="Sem medição" onClear={() => onChange({ semMedicao: false })} />}
          {filters.situacao !== 'todos' && <Chip label={SITUACAO_META[filters.situacao].label} onClear={() => onChange({ situacao: 'todos' })} />}
          {filters.empresaId !== 'todos' && <Chip label={empresas.find((e) => e.id === filters.empresaId)?.nome ?? 'Empresa'} onClear={() => onChange({ empresaId: 'todos' })} />}
          {filters.setorId !== 'todos' && <Chip label={setores.find((s) => s.id === filters.setorId)?.nome ?? 'Setor'} onClear={() => onChange({ setorId: 'todos' })} />}
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
      <button type="button" onClick={onClear} aria-label={`Remover filtro ${label}`} className="hover:text-primary/70">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}
