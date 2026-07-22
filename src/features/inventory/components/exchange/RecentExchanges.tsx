import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Repeat2, ArrowRight, ArrowLeftRight } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/app/StatusBadge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatNumberBR } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import type { TrocaDetalhe } from '../../services/inventoryApi';

interface Props { recentes: TrocaDetalhe[]; unidadeNome: Map<string, string>; loading: boolean }

export function RecentExchanges({ recentes, unidadeNome, loading }: Props) {
  const [sel, setSel] = useState<TrocaDetalhe | null>(null);
  return (
    <SectionCard title="Últimas trocas" description="Trocas recentes."
      actions={<Link to="/controle-estoque/movimentacoes" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Ver todas <ChevronRight className="h-3.5 w-3.5" /></Link>}>
      {loading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : recentes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center"><Repeat2 className="h-7 w-7 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhuma troca registrada ainda.</p></div>
      ) : (
        <ul className="divide-y divide-border/40">
          {recentes.map((t) => (
            <li key={t.id}>
              <button type="button" onClick={() => setSel(t)} className="w-full py-2.5 text-left hover:opacity-80" aria-label={`Detalhes da troca ${t.itemAntigo} para ${t.itemNovo}`}>
                <div className="flex items-center gap-1.5 text-sm"><span className="min-w-0 truncate font-medium text-foreground">{t.itemAntigo}</span><ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="min-w-0 truncate font-medium text-foreground">{t.itemNovo}</span></div>
                <div className="truncate text-xs text-muted-foreground">{t.colaborador} · {formatNumberBR(t.quantidade)} pç · {formatDateTimeBR(t.createdAt)}</div>
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
                <div className="flex items-center gap-2"><StatusBadge variant="info">Troca</StatusBadge><span className="font-mono text-sm text-foreground">{sel.recibo} → {sel.novoRecibo}</span></div>
                <SheetTitle className="mt-1 text-base">{sel.colaborador}</SheetTitle>
                <p className="text-xs text-muted-foreground">{formatDateTimeBR(sel.createdAt)} · {unidadeNome.get(sel.unidadeId) ?? '—'}</p>
              </SheetHeader>
              <ScrollArea className="min-h-0 flex-1 p-5">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <div className="rounded-lg border border-success/30 bg-success/5 p-2.5"><div className="text-[11px] text-muted-foreground">Devolvido</div><div className="truncate text-sm font-medium text-foreground">{sel.itemAntigo}</div><div className="truncate font-mono text-xs text-muted-foreground">{sel.itemAntigoCodigo}</div></div>
                  <ArrowLeftRight className="h-4 w-4 text-primary" />
                  <div className="rounded-lg border border-[hsl(217_90%_55%)]/30 bg-[hsl(217_90%_55%)]/5 p-2.5"><div className="text-[11px] text-muted-foreground">Novo</div><div className="truncate text-sm font-medium text-foreground">{sel.itemNovo}</div><div className="truncate font-mono text-xs text-muted-foreground">{sel.itemNovoCodigo}</div></div>
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <Campo rot="Quantidade" val={`${formatNumberBR(sel.quantidade)} pç`} />
                  <Campo rot="Unidade" val={unidadeNome.get(sel.unidadeId) ?? '—'} />
                </dl>
                {sel.motivo && <div className="mt-3 rounded-lg bg-muted/40 p-2.5"><p className="text-xs text-muted-foreground">Motivo</p><p className="text-sm text-foreground">{sel.motivo}</p></div>}
                <Button asChild variant="ghost" size="sm" className="mt-4 gap-1.5"><Link to="/controle-estoque/movimentacoes"><ArrowLeftRight className="h-4 w-4" /> Movimentações</Link></Button>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </SectionCard>
  );
}

function Campo({ rot, val }: { rot: string; val: string }) { return <div><dt className="text-xs text-muted-foreground">{rot}</dt><dd className="font-medium text-foreground">{val}</dd></div>; }
