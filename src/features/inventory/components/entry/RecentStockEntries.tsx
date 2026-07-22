import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, PackagePlus, FileText, Loader2, ArrowLeftRight } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge } from '@/components/app/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatNumberBR } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import { useDocumentoViewer } from '../../hooks/useDocumentoViewer';
import type { MovDetalhada } from '../../services/inventoryApi';

interface Props { recentes: MovDetalhada[]; unidadeNome: Map<string, string>; varNome: Map<string, string>; loading: boolean }

const totalQtd = (m: MovDetalhada) => m.itens.reduce((a, it) => a + it.quantidade, 0);

export function RecentStockEntries({ recentes, unidadeNome, varNome, loading }: Props) {
  const [sel, setSel] = useState<MovDetalhada | null>(null);
  const doc = useDocumentoViewer();

  return (
    <SectionCard title="Últimas entradas" description="Recebimentos recentes."
      actions={<Link to="/controle-estoque/movimentacoes" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Ver todas <ChevronRight className="h-3.5 w-3.5" /></Link>}>
      {loading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : recentes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center"><PackagePlus className="h-7 w-7 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhuma entrada registrada ainda.</p></div>
      ) : (
        <ul className="divide-y divide-border/40">
          {recentes.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => setSel(m)} className="w-full py-2.5 text-left hover:opacity-80" aria-label={`Detalhes da entrada ${m.numero}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-medium text-foreground">{m.numero}</span>
                  <span className="flex items-center gap-1.5">{m.documento && <StatusBadge variant="info"><FileText className="mr-0.5 h-3 w-3" />NF</StatusBadge>}<span className="text-sm font-semibold tabular-nums text-success">+{formatNumberBR(totalQtd(m))}</span></span>
                </div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">{m.itens.length} {m.itens.length === 1 ? 'item' : 'itens'} · {unidadeNome.get(m.unidadeId) ?? '—'} · {formatDateTimeBR(m.createdAt)}</div>
                <div className="truncate text-[11px] text-muted-foreground">{m.operadorNome}</div>
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
                <div className="flex items-center gap-2"><StatusBadge variant="success">Entrada</StatusBadge><span className="font-mono text-sm text-foreground">{sel.numero}</span></div>
                <SheetTitle className="sr-only">Entrada {sel.numero}</SheetTitle>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTimeBR(sel.createdAt)} · {unidadeNome.get(sel.unidadeId) ?? '—'} · {sel.operadorNome}</p>
              </SheetHeader>
              <ScrollArea className="min-h-0 flex-1 p-5">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div><dt className="text-xs text-muted-foreground">Itens</dt><dd className="font-medium text-foreground">{formatNumberBR(sel.itens.length)}</dd></div>
                  <div><dt className="text-xs text-muted-foreground">Total de peças</dt><dd className="font-medium tabular-nums text-success">+{formatNumberBR(totalQtd(sel))}</dd></div>
                </dl>
                {sel.observacao && <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">{sel.observacao}</p>}
                {sel.documento && <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => doc.abrir(sel.documento!.storage_key)} disabled={doc.abrindo === sel.documento.storage_key}>{doc.abrindo === sel.documento.storage_key ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Visualizar NF</Button>}
                <p className="mb-2 mt-5 text-xs font-medium text-muted-foreground">Itens</p>
                <ul className="space-y-2">
                  {sel.itens.map((it, i) => (
                    <li key={i} className="rounded-lg border border-border/60 p-2.5 text-sm">
                      <div className="flex items-center justify-between gap-2"><span className="truncate font-medium text-foreground">{varNome.get(it.varianteId) ?? 'Item'}</span><span className="tabular-nums font-medium text-success">+{formatNumberBR(it.quantidade)}</span></div>
                      <div className="mt-0.5 text-xs text-muted-foreground">Saldo: {formatNumberBR(it.saldoAnterior)} → {formatNumberBR(it.saldoPosterior)}</div>
                    </li>
                  ))}
                </ul>
                <Button asChild variant="ghost" size="sm" className="mt-4 gap-1.5"><Link to="/controle-estoque/movimentacoes"><ArrowLeftRight className="h-4 w-4" /> Abrir movimentações</Link></Button>
              </ScrollArea>
            </>
          )}
        </SheetContent>
      </Sheet>
    </SectionCard>
  );
}
