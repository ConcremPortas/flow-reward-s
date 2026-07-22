import { Search, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CompetenciaPicker } from '@/components/dashboard/CompetenciaPicker';
import type { HistoryFilters } from '@/features/dss/types';
import type { LocalDSS } from '@/hooks/useLocaisDSS';

interface Props {
  searchInput: string;
  onSearchChange: (v: string) => void;
  filters: HistoryFilters;
  onChange: (f: Partial<HistoryFilters>) => void;
  locais: LocalDSS[];
  onGenerateReport: () => void;
  reportDisabled: boolean;
}

export function DssHistoryFilters({ searchInput, onSearchChange, filters, onChange, locais, onGenerateReport, reportDisabled }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por tema ou local..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
      </div>

      <div className="flex items-center gap-1.5">
        <CompetenciaPicker value={filters.competenciaInicial || ''} onChange={(v) => onChange({ competenciaInicial: v })} className="w-[150px]" />
        <span className="text-xs text-muted-foreground">até</span>
        <CompetenciaPicker value={filters.competenciaFinal || ''} onChange={(v) => onChange({ competenciaFinal: v })} className="w-[150px]" />
      </div>

      <Select value={filters.localId} onValueChange={(v) => onChange({ localId: v })}>
        <SelectTrigger className="w-[160px]"><SelectValue placeholder="Local" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todos os locais</SelectItem>
          {locais.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
        </SelectContent>
      </Select>

      <Select value={filters.participacao} onValueChange={(v) => onChange({ participacao: v as HistoryFilters['participacao'] })}>
        <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Toda participação</SelectItem>
          <SelectItem value="baixa">Baixa (&lt;70%)</SelectItem>
          <SelectItem value="alta">Alta (≥90%)</SelectItem>
        </SelectContent>
      </Select>

      <Button variant="outline" size="sm" className="ml-auto gap-1.5" onClick={onGenerateReport} disabled={reportDisabled}>
        <FileText className="h-3.5 w-3.5" /> Gerar Relatório
      </Button>
    </div>
  );
}
