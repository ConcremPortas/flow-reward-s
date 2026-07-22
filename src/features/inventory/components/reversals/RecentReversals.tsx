import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, RotateCcw, ArrowLeftRight } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import { tipoMeta, totalPecas } from '../movements/movementMeta';
import { ORIGEM_LABEL } from '../movements/movementMeta';
import type { MovDetalhada } from '../../services/inventoryApi';
import type { FardamentoRow } from '../../types/db.types';

interface Props { estornos: MovDetalhada[]; fardPorVar: Map<string, FardamentoRow>; unidadeNome: Map<string, string>; loading: boolean }

export function RecentReversals({ estornos, fardPorVar, unidadeNome, loading }: Props) {
  const [sel, setSel] = useState<MovDetalhada | null>(null);
  const varNome = (id: string) => fardPorVar.get(id)?.variante.nome ?? 'Item';

  return (
    <SectionCard title="Histórico de estornos" description="Cancelamentos e estornos já registrados."
      actions={<Link to="/controle-estoque/movimentacoes" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Ver todos <ChevronRight className="h-3.5 w-3.5" /></Link>}>
      {loading ? <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        : estornos.length === 0 ? <div className="flex flex-col items-center gap-2 py-6 text-center"><RotateCcw className="h-7 w-7 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhum estorno registrado ainda.</p></div>
          : (
            <ul className="divide-y divide-border/40">
              {estornos.map((m) => { const meta = tipoMeta(m.tipo); const Icon = meta.icon; return (
                <li key={m.id}>
                  <button type="button" onClick={() => setSel(m)} className="w-full py-2.5 text-left hover:opacity-80">
                    <div className="flex items-center justify-between gap-2"><span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', meta.classe)}><Icon className="h-3 w-3" />{meta.label}</span><span className="font-mono text-xs text-foreground">{m.numero}</span></div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">{unidadeNome.get(m.unidadeId) ?? '—'} · {m.itens.length} itens · {formatDateTimeBR(m.createdAt)} · {m.operadorNome}</div>
                    {m.observacao && <div className="truncate text-[11px] text-muted-foreground">Motivo: {m.observacao}</div>}
                  </button>
                </li>
              ); })}
            </ul>
          )}

      <Sheet open={sel !== null} onOpenChange={(o) => { if (!o) setSel(null); }}>
        <SheetContent side="right" className="flex w-[94vw] flex-col gap-0 p-0 sm:max-w-md">
          {sel && (() => { const meta = tipoMeta(sel.tipo); const Icon = meta.icon; return (
            <>
              <SheetHeader className="border-b border-border/60 p-5 pb-4 text-left">
                <div className="flex items-center gap-2"><span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', meta.classe)}><Icon className="h-3 w-3" />{meta.label}</span><span className="font-mono text-sm text-foreground">{sel.numero}</span></div>
                <SheetTitle className="sr-only">Estorno {sel.numero}</SheetTitle>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTimeBR(sel.createdAt)} · {unidadeNome.get(sel.unidadeId) ?? '—'} · {sel.operadorNome}</p>
              </SheetHeader>
              <ScrollArea className="min-h-0 flex-1 p-5">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><dt className="text-xs text-muted-foreground">Operação revertida</dt><dd className="font-medium text-foreground">{sel.referenciaTipo ? (ORIGEM_LABEL[sel.referenciaTipo] ?? sel.referenciaTipo) : '—'}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Total de peças</dt><dd className="font-medium tabular-nums text-foreground">{formatNumberBR(totalPecas(sel))}</dd></div>
                </dl>
                {sel.observacao && <div className="mt-3 rounded-lg bg-muted/40 p-3 text-sm"><p className="text-xs text-muted-foreground">Motivo</p><p className="text-foreground">{sel.observacao}</p></div>}
                <p className="mb-2 mt-4 text-xs font-medium text-muted-foreground">Itens</p>
                <ul className="space-y-2">
                  {sel.itens.map((it, i) => (
                    <li key={i} className="rounded-lg border border-border/60 p-2.5 text-sm">
                      <div className="flex items-center justify-between gap-2"><span className="truncate font-medium text-foreground">{varNome(it.varianteId)}</span><span className={cn('tabular-nums font-medium', it.direcao === 'IN' ? 'text-success' : 'text-status-warning')}>{it.direcao === 'IN' ? '+' : '−'}{formatNumberBR(it.quantidade)}</span></div>
                      <div className="mt-0.5 text-xs text-muted-foreground">Saldo {formatNumberBR(it.saldoAnterior)} → {formatNumberBR(it.saldoPosterior)}</div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 rounded-lg border border-border/60 p-3 text-xs"><p className="mb-1 font-medium text-muted-foreground">Auditoria</p>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Responsável</span><span className="text-foreground">{sel.operadorNome}</span></div>
                  <div className="flex justify-between gap-2"><span className="text-muted-foreground">Data</span><span className="tabular-nums text-foreground">{formatDateTimeBR(sel.createdAt)}</span></div>
                  {sel.operacaoId && <div className="flex justify-between gap-2"><span className="text-muted-foreground">Operação</span><span className="font-mono text-foreground">{sel.operacaoId.slice(0, 8)}…</span></div>}
                </div>
                <Button asChild variant="ghost" size="sm" className="mt-4 gap-1.5"><Link to="/controle-estoque/movimentacoes"><ArrowLeftRight className="h-4 w-4" /> Ir para movimentações</Link></Button>
              </ScrollArea>
            </>
          ); })()}
        </SheetContent>
      </Sheet>
    </SectionCard>
  );
}
