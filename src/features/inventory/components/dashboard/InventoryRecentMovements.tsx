import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftRight, ChevronRight } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge, type StatusVariant } from '@/components/app/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatNumberBR } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import { MOVEMENT_TYPE_LABEL, MOVEMENT_IS_ENTRADA } from '../../domain/domainConstants';
import type { MovDetalhada } from '../../services/inventoryApi';

interface Props {
  recentes: MovDetalhada[];
  unidadeNome: Map<string, string>;
  varNome: Map<string, string>;
  loading: boolean;
}

const totalQtd = (m: MovDetalhada) => m.itens.reduce((a, it) => a + it.quantidade, 0);
const infoTipo = (tipo: string) => {
  const conhecido = tipo in MOVEMENT_TYPE_LABEL;
  const entrada = MOVEMENT_IS_ENTRADA[tipo as keyof typeof MOVEMENT_IS_ENTRADA] ?? true;
  const variant: StatusVariant = !conhecido ? 'neutral' : entrada ? 'success' : 'warning';
  return { label: conhecido ? MOVEMENT_TYPE_LABEL[tipo as keyof typeof MOVEMENT_TYPE_LABEL] : tipo, entrada, variant };
};

export function InventoryRecentMovements({ recentes, unidadeNome, varNome, loading }: Props) {
  const [sel, setSel] = useState<MovDetalhada | null>(null);
  const lista = recentes.slice(0, 8);

  return (
    <SectionCard title="Movimentações recentes" description="Operações do período selecionado."
      actions={<Link to="/controle-estoque/movimentacoes" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Ver todas <ChevronRight className="h-3.5 w-3.5" /></Link>}>
      {loading ? (
        <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : lista.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <ArrowLeftRight className="h-7 w-7 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Nenhuma movimentação no período.</p>
          <p className="text-xs text-muted-foreground">Amplie o período nos filtros.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border/40">
          {lista.map((m) => {
            const t = infoTipo(m.tipo);
            const qtd = totalQtd(m);
            return (
              <li key={m.id}>
                <button type="button" onClick={() => setSel(m)} className="flex w-full items-center justify-between gap-3 py-2.5 text-left hover:opacity-80" aria-label={`Detalhes de ${m.numero}`}>
                  <div className="flex min-w-0 items-center gap-2">
                    <StatusBadge variant={t.variant}>{t.label}</StatusBadge>
                    <div className="min-w-0">
                      <div className="truncate font-mono text-xs text-foreground">{m.numero}</div>
                      <div className="truncate text-xs text-muted-foreground">{m.itens.length} {m.itens.length === 1 ? 'item' : 'itens'} · {unidadeNome.get(m.unidadeId) ?? '—'}</div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className={`text-sm font-semibold tabular-nums ${t.entrada ? 'text-success' : 'text-status-warning'}`}>{t.entrada ? '+' : '−'}{formatNumberBR(qtd)}</div>
                    <div className="text-[11px] text-muted-foreground">{formatDateTimeBR(m.createdAt)}</div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <MovementDrawer mov={sel} unidadeNome={unidadeNome} varNome={varNome} onOpenChange={(o) => { if (!o) setSel(null); }} />
    </SectionCard>
  );
}

function MovementDrawer({ mov, unidadeNome, varNome, onOpenChange }: { mov: MovDetalhada | null; unidadeNome: Map<string, string>; varNome: Map<string, string>; onOpenChange: (o: boolean) => void }) {
  const t = mov ? infoTipo(mov.tipo) : null;
  return (
    <Sheet open={mov !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-[94vw] flex-col gap-0 p-0 sm:max-w-md">
        {mov && t && (
          <>
            <SheetHeader className="border-b border-border/60 p-5 pb-4 text-left">
              <div className="flex items-center gap-2"><StatusBadge variant={t.variant}>{t.label}</StatusBadge><span className="font-mono text-sm text-foreground">{mov.numero}</span></div>
              <SheetTitle className="sr-only">Movimentação {mov.numero}</SheetTitle>
            </SheetHeader>
            <ScrollArea className="min-h-0 flex-1 p-5">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <Campo rot="Data" val={formatDateTimeBR(mov.createdAt)} />
                <Campo rot="Local de estoque" val={unidadeNome.get(mov.unidadeId) ?? '—'} />
                <Campo rot="Responsável" val={mov.operadorNome} />
                <Campo rot="Total movimentado" val={`${t.entrada ? '+' : '−'}${formatNumberBR(totalQtd(mov))}`} />
              </dl>
              {mov.observacao && <p className="mt-4 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">{mov.observacao}</p>}
              <p className="mt-5 mb-2 text-xs font-medium text-muted-foreground">Itens</p>
              <ul className="space-y-2">
                {mov.itens.map((it, i) => (
                  <li key={i} className="rounded-lg border border-border/60 p-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-foreground">{varNome.get(it.varianteId) ?? 'Item'}</span>
                      <span className="tabular-nums font-medium">{it.direcao === 'IN' ? '+' : '−'}{formatNumberBR(it.quantidade)}</span>
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">Saldo: {formatNumberBR(it.saldoAnterior)} → {formatNumberBR(it.saldoPosterior)}</div>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Campo({ rot, val }: { rot: string; val: string }) {
  return <div><dt className="text-xs text-muted-foreground">{rot}</dt><dd className="font-medium text-foreground">{val}</dd></div>;
}
