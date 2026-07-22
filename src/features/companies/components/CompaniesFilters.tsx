import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COMPANY_STATUS_META } from '../domain/companyRegistrationStatus';
import type { CompanyFilters, CompanyStatusKind } from '../types/company.types';

interface Props {
  filters: CompanyFilters;
  onChange: (f: Partial<CompanyFilters>) => void;
  onReset: () => void;
  searchInput: string;
  onSearchChange: (v: string) => void;
  activeCount: number;
}

const SITUACOES: CompanyStatusKind[] = ['completo', 'revisar', 'inativo'];

export function CompaniesFilters({ filters, onChange, onReset, searchInput, onSearchChange, activeCount }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou CNPJ..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        </div>
        <Select value={filters.situacao} onValueChange={(v) => onChange({ situacao: v as CompanyFilters['situacao'] })}>
          <SelectTrigger className="w-[190px]"><SelectValue placeholder="Situação" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todas as situações</SelectItem>{SITUACOES.map(s => <SelectItem key={s} value={s}>{COMPANY_STATUS_META[s].label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{activeCount} filtro(s) ativo(s)</span>
          {filters.situacao !== 'todos' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {COMPANY_STATUS_META[filters.situacao].label}
              <button type="button" onClick={() => onChange({ situacao: 'todos' })} aria-label="Remover filtro" className="hover:text-primary/70"><X className="h-3 w-3" /></button>
            </span>
          )}
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onReset}>Limpar filtros</Button>
        </div>
      )}
    </div>
  );
}
