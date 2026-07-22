import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FORMULA_STATUS_META } from '../domain/rewardFormulaStatus';
import type { RewardFormulaFilters, FormulaStatusKind } from '../types/reward-formula.types';

interface Option { id: string; nome: string }
interface Props {
  filters: RewardFormulaFilters;
  onChange: (f: Partial<RewardFormulaFilters>) => void;
  onReset: () => void;
  searchInput: string;
  onSearchChange: (v: string) => void;
  activeCount: number;
  categorias: Option[];
  bases: Option[];
}

const SITUACOES: FormulaStatusKind[] = ['regular', 'incompleta', 'revisar', 'possivel_duplicidade'];

export function RewardFormulasFilters({ filters, onChange, onReset, searchInput, onSearchChange, activeCount, categorias, bases }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, descrição, categoria, base ou critério..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        </div>
        <Select value={filters.categoriaId} onValueChange={(v) => onChange({ categoriaId: v })}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todas categorias</SelectItem>{categorias.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.baseId} onValueChange={(v) => onChange({ baseId: v })}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Base" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todas as bases</SelectItem>{bases.map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.situacao} onValueChange={(v) => onChange({ situacao: v as RewardFormulaFilters['situacao'] })}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Situação" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todas situações</SelectItem>{SITUACOES.map(s => <SelectItem key={s} value={s}>{FORMULA_STATUS_META[s].label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.utilizacao} onValueChange={(v) => onChange({ utilizacao: v as RewardFormulaFilters['utilizacao'] })}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Utilização" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Toda utilização</SelectItem><SelectItem value="em_uso">Em uso</SelectItem><SelectItem value="sem_vinculo">Sem vínculo</SelectItem></SelectContent>
        </Select>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{activeCount} filtro(s) ativo(s)</span>
          {filters.categoriaId !== 'todos' && <Chip label={`Categoria: ${categorias.find(c => c.id === filters.categoriaId)?.nome ?? ''}`} onClear={() => onChange({ categoriaId: 'todos' })} />}
          {filters.baseId !== 'todos' && <Chip label={`Base: ${bases.find(b => b.id === filters.baseId)?.nome ?? ''}`} onClear={() => onChange({ baseId: 'todos' })} />}
          {filters.situacao !== 'todos' && <Chip label={FORMULA_STATUS_META[filters.situacao].label} onClear={() => onChange({ situacao: 'todos' })} />}
          {filters.utilizacao !== 'todos' && <Chip label={filters.utilizacao === 'em_uso' ? 'Em uso' : 'Sem vínculo'} onClear={() => onChange({ utilizacao: 'todos' })} />}
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
      <button type="button" onClick={onClear} aria-label={`Remover filtro ${label}`} className="hover:text-primary/70"><X className="h-3 w-3" /></button>
    </span>
  );
}
