import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ClipboardCheck, Printer, Loader2, ArrowLeftRight } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge } from '@/components/app/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatNumberBR } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import { ReciboEntregaDialog } from '../ReciboEntregaDialog';
import { getEntregaRecibo, type ReciboEntrega } from '../../services/inventoryApi';
import type { EntregaRow } from '../../types/db.types';
import { DELIVERY_TYPE_LABEL } from '../../domain/domainConstants';
import type { DeliveryType } from '../../types/inventory.types';

interface Props { recentes: EntregaRow[]; unidadeNome: Map<string, string>; loading: boolean }

const pecas = (e: EntregaRow) => (e.itens ?? []).reduce((a, i) => a + i.quantidade, 0);

export function RecentStockDeliveries({ recentes, unidadeNome, loading }: Props) {
  const [sel, setSel] = useState<EntregaRow | null>(null);
  const [recibo, setRecibo] = useState<ReciboEntrega | null>(null);
  const [emitindo, setEmitindo] = useState<string | null>(null);

  const emitir = async (id: string) => {
    setEmitindo(id);
    try { const r = await getEntregaRecibo(id); setRecibo(r); } catch { /* toast global se necessário */ } finally { setEmitindo(null); }
  };

  return (
    <SectionCard title="Últimas entregas" description="Entregas recentes com recibo."
      actions={<Link to="/controle-estoque/movimentacoes" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Ver todas <ChevronRight className="h-3.5 w-3.5" /></Link>}>
      {loading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : recentes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center"><ClipboardCheck className="h-7 w-7 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhuma entrega registrada ainda.</p></div>
      ) : (
        <ul className="divide-y divide-border/40">
          {recentes.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => setSel(e)} className="w-full py-2.5 text-left hover:opacity-80" aria-label={`Detalhes de ${e.recibo}`}>
                <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs font-medium text-foreground">{e.recibo}</span><span className="text-sm font-semibold tabular-nums text-status-warning">−{formatNumberBR(pecas(e))}</span></div>
                <div className="truncate text-sm text-foreground">{e.funcionario?.nome ?? '—'}</div>
                <div className="truncate text-xs text-muted-foreground">{DELIVERY_TYPE_LABEL[e.tipo as DeliveryType] ?? e.tipo} · {(e.itens ?? []).length} itens · {unidadeNome.get(e.unidade_id) ?? '—'} · {formatDateTimeBR(e.created_at)}</div>
              </button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={sel !== null} onOpenChange={(o) => { if (!o) setSel(null); }}>
        <SheetContent side="right" className="flex w-[94vw] flex-col gap-0 p-0 sm:max-w-md">
          {sel && (
            <>
              <SheetHeader className="border-b border-border/60 p-5 pb-4 text-left">
                <div className="flex items-center gap-2"><StatusBadge variant={sel.status === 'CONFIRMADA' ? 'success' : 'neutral'}>{DELIVERY_TYPE_LABEL[sel.tipo as DeliveryType] ?? sel.tipo}</StatusBadge><span className="font-mono text-sm text-foreground">{sel.recibo}</span></div>
                <SheetTitle className="mt-1 text-base">{sel.funcionario?.nome ?? '—'}</SheetTitle>
                <p className="text-xs text-muted-foreground">{formatDateTimeBR(sel.created_at)} · {unidadeNome.get(sel.unidade_id) ?? '—'}</p>
              </SheetHeader>
              <ScrollArea className="min-h-0 flex-1 p-5">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><dt className="text-xs text-muted-foreground">Itens</dt><dd className="font-medium text-foreground">{formatNumberBR((sel.itens ?? []).length)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Total de peças</dt><dd className="font-medium tabular-nums text-status-warning">−{formatNumberBR(pecas(sel))}</dd></div>
                </dl>
                <p className="mb-2 mt-4 text-xs font-medium text-muted-foreground">Itens</p>
                <ul className="space-y-2">
                  {(sel.itens ?? []).map((it, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-2.5 text-sm">
                      <span className="min-w-0 truncate text-foreground">{it.variante?.nome ?? 'Item'} <span className="font-mono text-xs text-muted-foreground">{it.variante?.codigo_interno}</span></span>
                      <span className="shrink-0 tabular-nums font-medium">{formatNumberBR(it.quantidade)}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" className="gap-2" onClick={() => emitir(sel.id)} disabled={emitindo === sel.id}>{emitindo === sel.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />} Emitir recibo</Button>
                  <Button asChild variant="ghost" size="sm" className="gap-1.5"><Link to="/controle-estoque/movimentacoes"><ArrowLeftRight className="h-4 w-4" /> Movimentações</Link></Button>
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ReciboEntregaDialog recibo={recibo} onOpenChange={(o) => { if (!o) setRecibo(null); }} />
    </SectionCard>
  );
}
