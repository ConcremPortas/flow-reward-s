import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CompetenciaPicker } from '@/components/dashboard/CompetenciaPicker';
import { competenciaLabelLong } from '@/features/dashboard/utils/dates';
import type { BasePremiacao } from '@/hooks/useBasePremiacao';
import type { Categoria } from '@/hooks/useCategorias';
import type { ReportFilters } from '../domain/rewardsReportFilters';

interface Props {
  filters: ReportFilters;
  onChange: (f: Partial<ReportFilters>) => void;
  onCriterio: (key: keyof ReportFilters['criterios'], v: boolean) => void;
  onReset: () => void;
  searchInput: string;
  onSearchChange: (v: string) => void;
  bases: BasePremiacao[];
  categorias: Categoria[];
  setores: string[];
  faixas: string[];
  activeCount: number;
}

const CRITERIOS: { key: keyof ReportFilters['criterios']; label: string }[] = [
  { key: 'producao', label: 'Produção' }, { key: 'epi', label: 'EPI' }, { key: 'faltas', label: 'Faltas' },
  { key: 'advertencias', label: 'Advertências' }, { key: 'dss', label: 'DSS' }, { key: 'indicadores', label: 'Indicadores' },
];

export function RewardsReportFilters({ filters, onChange, onCriterio, onReset, searchInput, onSearchChange, bases, categorias, setores, faixas, activeCount }: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const baseNome = filters.baseId === 'todos' ? 'Todas as bases' : bases.find(b => b.id === filters.baseId)?.nome ?? 'Base';
  const catNome = filters.categoria === 'todos' ? 'Todas as categorias' : filters.categoria;

  if (collapsed) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-2.5 text-sm">
        <span className="font-medium text-foreground">{filters.competencia ? competenciaLabelLong(filters.competencia) : 'Todas as competências'}</span>
        <span className="text-muted-foreground">· {baseNome} · {catNome}</span>
        {activeCount > 0 && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Filtros {activeCount}</span>}
        <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1 text-xs" onClick={() => setCollapsed(false)}><ChevronDown className="h-3.5 w-3.5" /> Filtros</Button>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 rounded-xl border border-border/70 bg-card px-4 py-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <CompetenciaPicker value={filters.competencia} onChange={(v) => onChange({ competencia: v })} className="w-[160px]" />
        <Select value={filters.baseId} onValueChange={(v) => onChange({ baseId: v })}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Base" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todas as bases</SelectItem>{bases.map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.categoria} onValueChange={(v) => onChange({ categoria: v })}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todas as categorias</SelectItem>{categorias.filter(c => ['AUXILIAR', 'SUPERVISOR', 'ENCARREGADO'].includes(c.nome.toUpperCase())).map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={filters.setor} onValueChange={(v) => onChange({ setor: v })}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Setor" /></SelectTrigger>
          <SelectContent><SelectItem value="todos">Todos os setores</SelectItem>{setores.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Nome, código ou setor..." value={searchInput} onChange={(e) => onSearchChange(e.target.value)} className="pl-9" />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5"><SlidersHorizontal className="h-4 w-4" /> Avançados {activeCount > 0 && <span className="rounded-full bg-primary/15 px-1.5 text-[11px] text-primary">{activeCount}</span>}</Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="end">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Faixa</label>
                <Select value={filters.faixa} onValueChange={(v) => onChange({ faixa: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="todos">Todas</SelectItem>{faixas.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Situação</label>
                <Select value={filters.situacao} onValueChange={(v) => onChange({ situacao: v as ReportFilters['situacao'] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="todos">Todas</SelectItem><SelectItem value="com_bonus">Com premiação</SelectItem><SelectItem value="sem_bonus">Sem premiação</SelectItem></SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={filters.somenteComDiferenca} onCheckedChange={(v) => onChange({ somenteComDiferenca: !!v })} /> Somente com diferença</label>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Critério impactado (nota &lt; 100%)</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {CRITERIOS.map(c => (
                    <label key={c.key} className="flex items-center gap-1.5 text-xs"><Checkbox checked={!!filters.criterios[c.key]} onCheckedChange={(v) => onCriterio(c.key, !!v)} /> {c.label}</label>
                  ))}
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="ghost" size="sm" className="h-9 gap-1 text-xs" onClick={() => setCollapsed(true)}><ChevronUp className="h-3.5 w-3.5" /> Recolher</Button>
      </div>

      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.baseId !== 'todos' && <Chip label={baseNome} onClear={() => onChange({ baseId: 'todos' })} />}
          {filters.categoria !== 'todos' && <Chip label={filters.categoria} onClear={() => onChange({ categoria: 'todos' })} />}
          {filters.setor !== 'todos' && <Chip label={filters.setor} onClear={() => onChange({ setor: 'todos' })} />}
          {filters.faixa !== 'todos' && <Chip label={filters.faixa} onClear={() => onChange({ faixa: 'todos' })} />}
          {filters.situacao !== 'todos' && <Chip label={filters.situacao === 'com_bonus' ? 'Com premiação' : 'Sem premiação'} onClear={() => onChange({ situacao: 'todos' })} />}
          {filters.somenteComDiferenca && <Chip label="Com diferença" onClear={() => onChange({ somenteComDiferenca: false })} />}
          {CRITERIOS.filter(c => filters.criterios[c.key]).map(c => <Chip key={c.key} label={c.label} onClear={() => onCriterio(c.key, false)} />)}
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
