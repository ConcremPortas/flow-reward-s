import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export interface PreviewFilters {
  search: string;
  setor: string;
  categoria: string;
  faixa: string;
  somenteSemBonus: boolean;
}

export const DEFAULT_PREVIEW_FILTERS: PreviewFilters = { search: '', setor: 'todos', categoria: 'todos', faixa: 'todos', somenteSemBonus: false };

interface Props {
  filters: PreviewFilters;
  onChange: (f: Partial<PreviewFilters>) => void;
  setores: string[];
  categorias: string[];
  faixas: string[];
}

export function RewardsPreviewFilters({ filters, onChange, setores, categorias, faixas }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="relative min-w-[180px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar funcionário..." value={filters.search} onChange={(e) => onChange({ search: e.target.value })} className="pl-9" />
      </div>
      <Select value={filters.setor} onValueChange={(v) => onChange({ setor: v })}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Setor" /></SelectTrigger>
        <SelectContent><SelectItem value="todos">Todos os setores</SelectItem>{setores.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={filters.categoria} onValueChange={(v) => onChange({ categoria: v })}>
        <SelectTrigger className="w-[150px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
        <SelectContent><SelectItem value="todos">Todas as categorias</SelectItem>{categorias.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={filters.faixa} onValueChange={(v) => onChange({ faixa: v })}>
        <SelectTrigger className="w-[140px]"><SelectValue placeholder="Faixa" /></SelectTrigger>
        <SelectContent><SelectItem value="todos">Todas as faixas</SelectItem>{faixas.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
      </Select>
      <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Checkbox checked={filters.somenteSemBonus} onCheckedChange={(v) => onChange({ somenteSemBonus: !!v })} /> Somente sem bônus
      </label>
    </div>
  );
}
