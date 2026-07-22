import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { JobEmployeeFilters } from '../types/job-employee.types';

const TODOS = '__todos__';
type Opt = { id: string; nome: string };

interface Props {
  filtros: JobEmployeeFilters;
  buscaInput: string;
  onBusca: (v: string) => void;
  empresas: Opt[];
  setores: Opt[];
  funcoes: Opt[];
  cargos: Opt[];
  autorizadoSalario: boolean;
  ativos: number;
  onChange: (f: Partial<JobEmployeeFilters>) => void;
  onLimpar: () => void;
}

export function JobEmployeesFilters(props: Props) {
  const { filtros, buscaInput, onBusca, empresas, setores, funcoes, cargos, autorizadoSalario, ativos, onChange, onLimpar } = props;
  const nome = (arr: Opt[], id: string | null) => arr.find((o) => o.id === id)?.nome;

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome, código, função, cargo ou setor..." value={buscaInput} onChange={(e) => onBusca(e.target.value)} className="pl-9" />
        </div>
        {empresas.length > 1 && (
          <Sel value={filtros.empresaId} onChange={(v) => onChange({ empresaId: v })} placeholder="Empresa" allLabel="Todas as empresas" options={empresas} />
        )}
        <Sel value={filtros.setorId} onChange={(v) => onChange({ setorId: v })} placeholder="Setor" allLabel="Todos os setores" options={setores} />
        <Sel value={filtros.funcaoId} onChange={(v) => onChange({ funcaoId: v })} placeholder="Função" allLabel="Todas as funções" options={funcoes} />
        {cargos.length > 0 && (
          <Sel value={filtros.cargoId} onChange={(v) => onChange({ cargoId: v })} placeholder="Cargo" allLabel="Todos os cargos" options={cargos} />
        )}
        <Select value={filtros.status} onValueChange={(v) => onChange({ status: v as JobEmployeeFilters['status'] })}>
          <SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="inativos">Inativos</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtros.enquadramento} onValueChange={(v) => onChange({ enquadramento: v as JobEmployeeFilters['enquadramento'] })}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Enquadramento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todo enquadramento</SelectItem>
            <SelectItem value="enquadrados">Enquadrados</SelectItem>
            <SelectItem value="sem_cargo">Sem cargo</SelectItem>
            <SelectItem value="pendentes">Com pendência</SelectItem>
          </SelectContent>
        </Select>
        {autorizadoSalario && (
          <Select value={filtros.faixa} onValueChange={(v) => onChange({ faixa: v as JobEmployeeFilters['faixa'] })}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Faixa" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Toda faixa</SelectItem>
              <SelectItem value="dentro">Dentro da faixa</SelectItem>
              <SelectItem value="abaixo">Abaixo da faixa</SelectItem>
              <SelectItem value="acima">Acima da faixa</SelectItem>
              <SelectItem value="sem_salario">Sem salário</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {ativos > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">{ativos} filtro(s) ativo(s)</span>
          {filtros.busca.trim() !== '' && <Chip label={`"${filtros.busca.trim()}"`} onClear={() => onBusca('')} />}
          {nome(empresas, filtros.empresaId) && <Chip label={nome(empresas, filtros.empresaId)!} onClear={() => onChange({ empresaId: null })} />}
          {nome(setores, filtros.setorId) && <Chip label={nome(setores, filtros.setorId)!} onClear={() => onChange({ setorId: null })} />}
          {nome(funcoes, filtros.funcaoId) && <Chip label={nome(funcoes, filtros.funcaoId)!} onClear={() => onChange({ funcaoId: null })} />}
          {nome(cargos, filtros.cargoId) && <Chip label={nome(cargos, filtros.cargoId)!} onClear={() => onChange({ cargoId: null })} />}
          {filtros.status !== 'ativos' && <Chip label={filtros.status === 'inativos' ? 'Inativos' : 'Todos'} onClear={() => onChange({ status: 'ativos' })} />}
          {filtros.enquadramento !== 'todos' && <Chip label={filtros.enquadramento} onClear={() => onChange({ enquadramento: 'todos' })} />}
          {filtros.faixa !== 'todas' && <Chip label={filtros.faixa} onClear={() => onChange({ faixa: 'todas' })} />}
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={onLimpar}>Limpar filtros</Button>
        </div>
      )}
    </div>
  );
}

function Sel({ value, onChange, placeholder, allLabel, options }: { value: string | null; onChange: (v: string | null) => void; placeholder: string; allLabel: string; options: Opt[] }) {
  return (
    <Select value={value ?? TODOS} onValueChange={(v) => onChange(v === TODOS ? null : v)}>
      <SelectTrigger className="w-[160px]"><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        <SelectItem value={TODOS}>{allLabel}</SelectItem>
        {options.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
      </SelectContent>
    </Select>
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
