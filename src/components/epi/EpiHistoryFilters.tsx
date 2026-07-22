import { Search, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { EpiHistoryFilters as Filters } from '@/features/epi/types/epi.types';

interface Option { id: string; nome: string }

interface Props {
  searchInput: string;
  onSearchChange: (v: string) => void;
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  empresas: Option[];
  setores: Option[];
  onGenerateReport: () => void;
  reportDisabled: boolean;
}

export function EpiHistoryFilters({ searchInput, onSearchChange, filters, onChange, empresas, setores, onGenerateReport, reportDisabled }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por título..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
      </div>

      <Input type="date" className="w-[150px]" value={filters.dataInicial} onChange={(e) => onChange({ dataInicial: e.target.value })} aria-label="Data inicial" />
      <span className="text-xs text-muted-foreground">até</span>
      <Input type="date" className="w-[150px]" value={filters.dataFinal} onChange={(e) => onChange({ dataFinal: e.target.value })} aria-label="Data final" />

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

      <Input
        type="number" placeholder="Taxa mín. %" className="w-[110px]" value={filters.taxaMinima}
        onChange={(e) => onChange({ taxaMinima: e.target.value })} min={0} max={100}
      />

      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Checkbox checked={filters.somenteComNaoConformidades} onCheckedChange={(v) => onChange({ somenteComNaoConformidades: !!v })} />
        Somente com não conformidades
      </label>

      <Button variant="outline" size="sm" className="ml-auto gap-1.5" onClick={onGenerateReport} disabled={reportDisabled}>
        <FileText className="h-3.5 w-3.5" /> Gerar Relatório
      </Button>
    </div>
  );
}
