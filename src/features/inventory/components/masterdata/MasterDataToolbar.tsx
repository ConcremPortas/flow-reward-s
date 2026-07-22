import { Search, X, ArrowUpDown, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { Ordenacao, StatusFiltro } from './masterShared';

const STATUS: { k: StatusFiltro; l: string }[] = [{ k: 'todos', l: 'Todos' }, { k: 'ativos', l: 'Ativos' }, { k: 'inativos', l: 'Inativos' }];
const ORDENS: { k: Ordenacao; l: string }[] = [{ k: 'nome', l: 'Nome (A–Z)' }, { k: 'recentes', l: 'Atualizados' }, { k: 'pendencias', l: 'Pendências' }];

interface Props {
  placeholder: string;
  buscaRaw: string; onBusca: (v: string) => void;
  status: StatusFiltro; onStatus: (s: StatusFiltro) => void;
  ordenacao: Ordenacao; onOrdenacao: (o: Ordenacao) => void;
  soPendencias: boolean; onSoPendencias: (v: boolean) => void;
  resultado: number; total: number;
  onLimpar: () => void; temFiltro: boolean;
}

/** Barra de busca + filtros contextuais da aba (status, pendências, ordenação). */
export function MasterDataToolbar({ placeholder, buscaRaw, onBusca, status, onStatus, ordenacao, onOrdenacao, soPendencias, onSoPendencias, resultado, total, onLimpar, temFiltro }: Props) {
  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={buscaRaw} onChange={(e) => onBusca(e.target.value)} placeholder={placeholder} className="pl-9" aria-label="Buscar" />
        </div>

        <div className="flex rounded-lg border border-border/70 p-0.5" role="group" aria-label="Status">
          {STATUS.map((sf) => (
            <button key={sf.k} type="button" onClick={() => onStatus(sf.k)} aria-pressed={status === sf.k}
              className={cn('rounded-md px-2.5 py-1 text-xs font-medium transition-colors', status === sf.k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>{sf.l}</button>
          ))}
        </div>

        <button type="button" onClick={() => onSoPendencias(!soPendencias)} aria-pressed={soPendencias}
          className={cn('inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
            soPendencias ? 'border-status-warning/40 bg-status-warning/10 text-status-warning' : 'border-border/70 text-muted-foreground hover:text-foreground')}>
          <AlertTriangle className="h-3.5 w-3.5" /> Pendências
        </button>

        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={ordenacao} onValueChange={(v) => onOrdenacao(v as Ordenacao)}>
            <SelectTrigger className="h-9 w-40" aria-label="Ordenar"><SelectValue /></SelectTrigger>
            <SelectContent>{ORDENS.map((o) => <SelectItem key={o.k} value={o.k}>{o.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {temFiltro && <Button variant="ghost" className="shrink-0 gap-1.5" onClick={onLimpar}><X className="h-4 w-4" /> Limpar</Button>}
      </div>

      <p className="text-xs text-muted-foreground">
        {resultado === total ? `${resultado} registro(s)` : `${resultado} de ${total} registro(s)`}
      </p>
    </div>
  );
}
