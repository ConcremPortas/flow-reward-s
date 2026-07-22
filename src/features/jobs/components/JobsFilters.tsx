import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { JobFilters } from '../types/job.types';

const TODOS = '__todos__';

interface Props {
  filtros: JobFilters;
  setores: Array<{ id: string; nome: string }>;
  niveis: string[];
  ativos: number;
  onChange: (f: Partial<JobFilters>) => void;
  onLimpar: () => void;
}

export function JobsFilters({ filtros, setores, niveis, ativos, onChange, onLimpar }: Props) {
  const setorNome = setores.find((s) => s.id === filtros.setorId)?.nome;
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, setor, nível ou descrição..." value={filtros.busca} onChange={(e) => onChange({ busca: e.target.value })} className="pl-9" />
        </div>
        <Select value={filtros.setorId ?? TODOS} onValueChange={(v) => onChange({ setorId: v === TODOS ? null : v })}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Setor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os setores</SelectItem>
            {setores.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtros.nivel ?? TODOS} onValueChange={(v) => onChange({ nivel: v === TODOS ? null : v })}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Nível" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={TODOS}>Todos os níveis</SelectItem>
            {niveis.map((n) => <SelectItem key={n} value={n}>{`Nível ${n}`}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtros.status} onValueChange={(v) => onChange({ status: v as JobFilters['status'] })}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="inativos">Inativos</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtros.ocupacao} onValueChange={(v) => onChange({ ocupacao: v as JobFilters['ocupacao'] })}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Ocupação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Toda ocupação</SelectItem>
            <SelectItem value="ocupados">Ocupados</SelectItem>
            <SelectItem value="sem_ocupantes">Sem ocupantes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtros.faixa} onValueChange={(v) => onChange({ faixa: v as JobFilters['faixa'] })}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Faixa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Qualquer faixa</SelectItem>
            <SelectItem value="com_faixa">Com faixa</SelectItem>
            <SelectItem value="sem_faixa">Sem faixa</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtros.situacao} onValueChange={(v) => onChange({ situacao: v as JobFilters['situacao'] })}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Situação" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Toda situação</SelectItem>
            <SelectItem value="regular">Regulares</SelectItem>
            <SelectItem value="incompleta">Com pendência</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {ativos > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{ativos} filtro(s) ativo(s)</span>
          {filtros.busca.trim() !== '' && <Chip label={`"${filtros.busca.trim()}"`} onClear={() => onChange({ busca: '' })} />}
          {setorNome && <Chip label={setorNome} onClear={() => onChange({ setorId: null })} />}
          {filtros.nivel && <Chip label={`Nível ${filtros.nivel}`} onClear={() => onChange({ nivel: null })} />}
          {filtros.status !== 'ativos' && <Chip label={filtros.status === 'inativos' ? 'Inativos' : 'Todos os status'} onClear={() => onChange({ status: 'ativos' })} />}
          {filtros.ocupacao !== 'todas' && <Chip label={filtros.ocupacao === 'ocupados' ? 'Ocupados' : 'Sem ocupantes'} onClear={() => onChange({ ocupacao: 'todas' })} />}
          {filtros.faixa !== 'todas' && <Chip label={filtros.faixa === 'com_faixa' ? 'Com faixa' : 'Sem faixa'} onClear={() => onChange({ faixa: 'todas' })} />}
          {filtros.situacao !== 'todas' && <Chip label={filtros.situacao === 'regular' ? 'Regulares' : 'Com pendência'} onClear={() => onChange({ situacao: 'todas' })} />}
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onLimpar}>Limpar filtros</Button>
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
