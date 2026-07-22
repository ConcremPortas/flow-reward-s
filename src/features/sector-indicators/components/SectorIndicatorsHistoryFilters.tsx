import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompetenciaPicker } from '@/components/dashboard/CompetenciaPicker';
import { SITUACAO_META } from '../domain/indicatorStatus';
import { INDICATOR_DEFINITIONS } from '../domain/indicatorDefinitions';
import type { SectorIndicatorHistoryFilters as Filters, IndicatorSituacao } from '../types/sector-indicators.types';

interface Option { id: string; nome: string }

interface Props {
  searchInput: string;
  onSearchChange: (v: string) => void;
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  empresas: Option[];
  setores: Option[];
}

const SITUACOES: IndicatorSituacao[] = ['superada', 'proxima', 'abaixo', 'sem_medicao'];

export function SectorIndicatorsHistoryFilters({ searchInput, onSearchChange, filters, onChange, empresas, setores }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por setor..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
      </div>

      <div className="flex items-center gap-1.5">
        <CompetenciaPicker value={filters.competenciaInicial} onChange={(v) => onChange({ competenciaInicial: v })} className="w-[150px]" />
        <span className="text-xs text-muted-foreground">até</span>
        <CompetenciaPicker value={filters.competenciaFinal} onChange={(v) => onChange({ competenciaFinal: v })} className="w-[150px]" />
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

      <Select value={filters.situacao} onValueChange={(v) => onChange({ situacao: v as Filters['situacao'] })}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Situação" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas as situações</SelectItem>
          {SITUACOES.map((s) => <SelectItem key={s} value={s}>{SITUACAO_META[s].label}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.indicatorId} onValueChange={(v) => onChange({ indicatorId: v as Filters['indicatorId'] })}>
        <SelectTrigger className="w-[170px]"><SelectValue placeholder="Indicador" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os indicadores</SelectItem>
          {INDICATOR_DEFINITIONS.map((d) => <SelectItem key={d.id} value={d.id}>{d.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
