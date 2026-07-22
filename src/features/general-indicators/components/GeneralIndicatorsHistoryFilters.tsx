import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompetenciaPicker } from '@/components/dashboard/CompetenciaPicker';
import type { TipoIndicadorGeral } from '@/hooks/useTiposIndicadoresGerais';
import { SITUACAO_META } from '../domain/indicatorStatus';
import type { GeneralIndicatorFilters, GeneralSituacao } from '../types/general-indicators.types';

interface Props {
  searchInput: string;
  onSearchChange: (v: string) => void;
  filters: GeneralIndicatorFilters;
  onChange: (f: Partial<GeneralIndicatorFilters>) => void;
  onReset: () => void;
  tipos: TipoIndicadorGeral[];
  activeCount: number;
}

const SITUACOES: GeneralSituacao[] = ['superada', 'atingida', 'atencao', 'abaixo', 'sem_dados'];

export function GeneralIndicatorsHistoryFilters({ searchInput, onSearchChange, filters, onChange, onReset, tipos, activeCount }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por indicador..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        </div>

        <Select value={filters.tipoId} onValueChange={(v) => onChange({ tipoId: v })}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Indicador" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os indicadores</SelectItem>
            {tipos.map((t) => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5">
          <CompetenciaPicker value={filters.competenciaInicial} onChange={(v) => onChange({ competenciaInicial: v })} className="w-[150px]" />
          <span className="text-xs text-muted-foreground">até</span>
          <CompetenciaPicker value={filters.competenciaFinal} onChange={(v) => onChange({ competenciaFinal: v })} className="w-[150px]" />
        </div>

        <Select value={filters.situacao} onValueChange={(v) => onChange({ situacao: v as GeneralIndicatorFilters['situacao'] })}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Situação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as situações</SelectItem>
            {SITUACOES.map((s) => <SelectItem key={s} value={s}>{SITUACAO_META[s].label}</SelectItem>)}
          </SelectContent>
        </Select>

        <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Checkbox checked={filters.somenteInconsistencias} onCheckedChange={(v) => onChange({ somenteInconsistencias: !!v })} />
          Possível inconsistência
        </label>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{activeCount} filtro(s) ativo(s)</span>
          {filters.tipoId !== 'todos' && <Chip label={tipos.find((t) => t.id === filters.tipoId)?.nome ?? 'Indicador'} onClear={() => onChange({ tipoId: 'todos' })} />}
          {filters.situacao !== 'todos' && <Chip label={SITUACAO_META[filters.situacao].label} onClear={() => onChange({ situacao: 'todos' })} />}
          {filters.competenciaInicial && <Chip label={`de ${filters.competenciaInicial}`} onClear={() => onChange({ competenciaInicial: '' })} />}
          {filters.competenciaFinal && <Chip label={`até ${filters.competenciaFinal}`} onClear={() => onChange({ competenciaFinal: '' })} />}
          {filters.somenteInconsistencias && <Chip label="Possível inconsistência" onClear={() => onChange({ somenteInconsistencias: false })} />}
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
