import { Search, X, Printer, ArrowLeftRight } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge, type StatusVariant } from '@/components/app/StatusBadge';
import { EmptyState } from '@/components/app/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNumberBR } from '@/lib/formatters';
import { formatDateBR } from '@/lib/dateTime';
import { DELIVERY_TYPE_LABEL } from '../../domain/domainConstants';
import { maskCpf } from '../delivery/cpf';
import type { DeliveryType } from '../../types/inventory.types';
import type { EntregaLista, DisponivelItem } from '../../hooks/useStockReturns';
import type { EntregaRow, UnidadeRow } from '../../types/db.types';
import type { Funcionario } from '@/hooks/useFuncionarios';

const STATUS_BADGE: Record<string, { label: string; variant: StatusVariant }> = {
  sem: { label: 'Disponível', variant: 'success' }, parcial: { label: 'Devolução parcial', variant: 'warning' }, total: { label: 'Devolvida', variant: 'neutral' },
};

interface Props {
  buscaRaw: string; setBusca: (v: string) => void; fUnidade: string; setFUnidade: (v: string) => void; fComDisponivel: boolean; setFComDisponivel: (v: boolean) => void;
  unidades: UnidadeRow[]; lista: EntregaLista[]; loading: boolean;
  entrega: EntregaRow | null; funcionario: Funcionario | null; disponiveis: DisponivelItem[];
  onSelect: (e: EntregaRow) => void; onLimpar: () => void; onVerRecibo: (id: string) => void; onAbrirEntrega: () => void;
}

const ALL = '__all__';

export function DeliveryOriginPanel({ buscaRaw, setBusca, fUnidade, setFUnidade, fComDisponivel, setFComDisponivel, unidades, lista, loading, entrega, funcionario, disponiveis, onSelect, onLimpar, onVerRecibo, onAbrirEntrega }: Props) {
  if (entrega) {
    const entregue = disponiveis.reduce((a, d) => a + d.entregue, 0);
    const devolvido = disponiveis.reduce((a, d) => a + d.devolvido, 0);
    const disponivel = disponiveis.reduce((a, d) => a + d.disponivel, 0);
    const uNome = unidades.find((u) => u.id === entrega.unidade_id)?.nome ?? '—';
    return (
      <SectionCard title="Entrega de origem" description="Entrega selecionada para devolução."
        actions={<Button variant="ghost" size="sm" className="gap-1.5" onClick={onLimpar}><X className="h-4 w-4" /> Trocar</Button>}>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-sm font-medium text-foreground">{entrega.recibo}</span>
            <StatusBadge variant="neutral">{DELIVERY_TYPE_LABEL[entrega.tipo as DeliveryType] ?? entrega.tipo}</StatusBadge>
          </div>
          <div><div className="font-medium text-foreground">{funcionario?.nome ?? entrega.funcionario?.nome ?? '—'}</div>
            <div className="text-xs text-muted-foreground">{[maskCpf(funcionario?.cpf), funcionario?.setor?.nome, funcionario?.funcao?.nome].filter(Boolean).join(' · ') || '—'}</div></div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Campo rot="Empresa" val={funcionario?.empresa?.nome ?? '—'} />
            <Campo rot="Unidade de origem" val={uNome} />
            <Campo rot="Data" val={formatDateBR(entrega.created_at)} />
            <Campo rot="Itens" val={formatNumberBR(disponiveis.length)} />
          </dl>
          <div className="grid grid-cols-3 gap-2 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-center">
            <T rot="Entregue" val={formatNumberBR(entregue)} />
            <T rot="Devolvido" val={formatNumberBR(devolvido)} />
            <T rot="Disponível" val={formatNumberBR(disponivel)} tone="pos" />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => onVerRecibo(entrega.id)}><Printer className="h-3.5 w-3.5" /> Ver recibo</Button>
            <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs" onClick={onAbrirEntrega}><ArrowLeftRight className="h-3.5 w-3.5" /> Movimentações</Button>
          </div>
        </div>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Entrega de origem" description="Encontre a entrega a devolver.">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={buscaRaw} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por recibo, colaborador, setor, cargo..." className="pl-9" aria-label="Buscar entrega" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={fUnidade || ALL} onValueChange={(v) => setFUnidade(v === ALL ? '' : v)}>
            <SelectTrigger className="h-9 w-full sm:w-44" aria-label="Filtrar por unidade"><SelectValue placeholder="Todas as unidades" /></SelectTrigger>
            <SelectContent><SelectItem value={ALL}>Todas as unidades</SelectItem>{unidades.map((u) => <SelectItem key={u.id} value={u.id}>{u.nome}</SelectItem>)}</SelectContent>
          </Select>
          <label className="flex h-9 cursor-pointer items-center gap-2 text-sm text-foreground"><Checkbox checked={fComDisponivel} onCheckedChange={(v) => setFComDisponivel(Boolean(v))} /> Só com disponível</label>
        </div>

        {loading ? (
          <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : lista.length === 0 ? (
          <EmptyState title="Nenhuma entrega encontrada" description="Ajuste a busca ou os filtros." action={<Button variant="outline" size="sm" onClick={() => { setBusca(''); setFUnidade(''); setFComDisponivel(false); }}>Limpar filtros</Button>} />
        ) : (
          <ul className="max-h-[28rem] space-y-2 overflow-y-auto">
            {lista.map((x) => {
              const b = STATUS_BADGE[x.status];
              return (
                <li key={x.e.id}>
                  <button type="button" onClick={() => onSelect(x.e)} className="w-full rounded-lg border border-border/60 p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs font-medium text-foreground">{x.e.recibo}</span><StatusBadge variant={b.variant}>{b.label}</StatusBadge></div>
                    <div className="truncate text-sm text-foreground">{x.funcionario?.nome ?? x.e.funcionario?.nome ?? '—'}</div>
                    <div className="truncate text-xs text-muted-foreground">{DELIVERY_TYPE_LABEL[x.e.tipo as DeliveryType] ?? x.e.tipo} · {(x.e.itens ?? []).length} itens · {formatDateBR(x.e.created_at)}{x.devolvido > 0 ? ` · ${formatNumberBR(x.devolvido)} devolvido` : ''}</div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </SectionCard>
  );
}

function Campo({ rot, val }: { rot: string; val: string }) { return <div><dt className="text-xs text-muted-foreground">{rot}</dt><dd className="truncate font-medium text-foreground">{val}</dd></div>; }
function T({ rot, val, tone }: { rot: string; val: string; tone?: 'pos' }) { return <div><div className={`text-base font-bold tabular-nums ${tone === 'pos' ? 'text-success' : 'text-foreground'}`}>{val}</div><div className="text-[11px] text-muted-foreground">{rot}</div></div>; }
