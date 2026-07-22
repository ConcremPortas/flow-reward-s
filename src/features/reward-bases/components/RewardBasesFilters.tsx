import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { REWARD_BASE_STATUS_META } from '../domain/rewardBaseStatus';
import { TIPO_META } from '../domain/rewardBaseFormatting';
import type { RewardBaseFilters, RewardBaseStatusKind, RewardBaseTipo } from '../types/reward-base.types';

interface Props {
  filters: RewardBaseFilters;
  onChange: (f: Partial<RewardBaseFilters>) => void;
  onReset: () => void;
  searchInput: string;
  onSearchChange: (v: string) => void;
  activeCount: number;
}

const TIPOS: RewardBaseTipo[] = ['percentual', 'valor_fixo'];
const SITUACOES: RewardBaseStatusKind[] = ['regular', 'revisar', 'sem_vinculo', 'config_incompleta'];
const UTIL_LABEL: Record<RewardBaseFilters['utilizacao'], string> = {
  todos: 'Toda utilização', em_uso: 'Em uso', sem_vinculo: 'Sem vínculo', somente_historico: 'Somente histórico',
};

export function RewardBasesFilters({ filters, onChange, onReset, searchInput, onSearchChange, activeCount }: Props) {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, descrição ou tipo..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        </div>
        <Select value={filters.tipo} onValueChange={(v) => onChange({ tipo: v as RewardBaseFilters['tipo'] })}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos os tipos</SelectItem>{TIPOS.map(t => <SelectItem key={t} value={t}>{TIPO_META[t].label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.utilizacao} onValueChange={(v) => onChange({ utilizacao: v as RewardBaseFilters['utilizacao'] })}>
          <SelectTrigger className="w-[170px]"><SelectValue placeholder="Utilização" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Toda utilização</SelectItem>
            <SelectItem value="em_uso">Em uso</SelectItem>
            <SelectItem value="sem_vinculo">Sem vínculo</SelectItem>
            <SelectItem value="somente_historico">Somente histórico</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filters.situacao} onValueChange={(v) => onChange({ situacao: v as RewardBaseFilters['situacao'] })}>
          <SelectTrigger className="w-[190px]"><SelectValue placeholder="Situação" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todas as situações</SelectItem>{SITUACOES.map(s => <SelectItem key={s} value={s}>{REWARD_BASE_STATUS_META[s].label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{activeCount} filtro(s) ativo(s)</span>
          {filters.tipo !== 'todos' && <Chip label={TIPO_META[filters.tipo].label} onClear={() => onChange({ tipo: 'todos' })} />}
          {filters.utilizacao !== 'todos' && <Chip label={UTIL_LABEL[filters.utilizacao]} onClear={() => onChange({ utilizacao: 'todos' })} />}
          {filters.situacao !== 'todos' && <Chip label={REWARD_BASE_STATUS_META[filters.situacao].label} onClear={() => onChange({ situacao: 'todos' })} />}
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
