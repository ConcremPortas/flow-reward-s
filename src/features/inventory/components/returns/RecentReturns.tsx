import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Repeat2, ArrowLeftRight, Undo2 } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge } from '@/components/app/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatNumberBR } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import { RETURN_CONDITION_LABEL, RETURN_DESTINATION_LABEL } from '../../domain/domainConstants';
import type { ReturnCondition, ReturnDestination } from '../../types/inventory.types';
import type { DevolucaoDetalhe } from '../../services/inventoryApi';

interface Props { recentes: DevolucaoDetalhe[]; unidadeNome: Map<string, string>; loading: boolean }

export function RecentReturns({ recentes, unidadeNome, loading }: Props) {
  const [sel, setSel] = useState<DevolucaoDetalhe | null>(null);

  return (
    <SectionCard title="Últimas devoluções" description="Devoluções recentes."
      actions={<Link to="/controle-estoque/movimentacoes" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Ver todas <ChevronRight className="h-3.5 w-3.5" /></Link>}>
      {loading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : recentes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center"><Repeat2 className="h-7 w-7 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhuma devolução registrada ainda.</p></div>
      ) : (
        <ul className="divide-y divide-border/40">
          {recentes.map((d) => (
            <li key={d.id}>
              <button type="button" onClick={() => setSel(d)} className="w-full py-2.5 text-left hover:opacity-80" aria-label={`Detalhes da devolução de ${d.varianteNome}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-foreground">{d.varianteNome}</span>
                  <span className="flex shrink-0 items-center gap-1.5">{d.reestocado ? <StatusBadge variant="success">+{formatNumberBR(d.quantidade)}</StatusBadge> : <StatusBadge variant="neutral">{formatNumberBR(d.quantidade)} pç</StatusBadge>}</span>
                </div>
                <div className="truncate text-xs text-muted-foreground">{d.funcionarioNome} · {d.recibo}</div>
                <div className="truncate text-[11px] text-muted-foreground">{RETURN_CONDITION_LABEL[d.condicao as ReturnCondition] ?? d.condicao} → {RETURN_DESTINATION_LABEL[d.destino as ReturnDestination] ?? d.destino} · {formatDateTimeBR(d.createdAt)}</div>
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
                <div className="flex items-center gap-2"><StatusBadge variant={sel.status === 'ATIVA' ? 'success' : 'neutral'}>Devolução</StatusBadge>{sel.status === 'ESTORNADA' && <StatusBadge variant="warning">Estornada</StatusBadge>}</div>
                <SheetTitle className="mt-1 text-base">{sel.varianteNome}</SheetTitle>
                <p className="text-xs text-muted-foreground">{sel.funcionarioNome} · {formatDateTimeBR(sel.createdAt)}</p>
              </SheetHeader>
              <ScrollArea className="min-h-0 flex-1 p-5">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                  <Campo rot="Recibo de origem" val={sel.recibo} />
                  <Campo rot="Unidade" val={unidadeNome.get(sel.unidadeId) ?? '—'} />
                  <Campo rot="Código" val={sel.varianteCodigo} />
                  <Campo rot="Quantidade" val={`${formatNumberBR(sel.quantidade)} pç`} />
                  <Campo rot="Condição" val={RETURN_CONDITION_LABEL[sel.condicao as ReturnCondition] ?? sel.condicao} />
                  <Campo rot="Destino" val={RETURN_DESTINATION_LABEL[sel.destino as ReturnDestination] ?? sel.destino} />
                  <Campo rot="Reentrada no estoque" val={sel.reestocado ? 'Sim' : 'Não'} />
                  <Campo rot="Responsável" val={sel.responsavel} />
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button asChild variant="ghost" size="sm" className="gap-1.5"><Link to="/controle-estoque/movimentacoes"><ArrowLeftRight className="h-4 w-4" /> Movimentações</Link></Button>
                  {sel.status === 'ATIVA' && <Button asChild variant="outline" size="sm" className="gap-1.5"><Link to="/controle-estoque/estornos"><Undo2 className="h-4 w-4" /> Estornar</Link></Button>}
                </div>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </SectionCard>
  );
}

function Campo({ rot, val }: { rot: string; val: string }) {
  return <div><dt className="text-xs text-muted-foreground">{rot}</dt><dd className="font-medium text-foreground">{val}</dd></div>;
}
