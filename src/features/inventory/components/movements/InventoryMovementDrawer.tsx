import { Link } from 'react-router-dom';
import { FileText, Loader2, ArrowLeftRight, Link2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/app/StatusBadge';
import { cn } from '@/lib/utils';
import { formatNumberBR, formatCurrencyBRL } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import { useDocumentoViewer } from '../../hooks/useDocumentoViewer';
import { tipoMeta, direcaoMov, totalPecas, valorMov, ORIGEM_LABEL, DIRECAO_LABEL } from './movementMeta';
import type { MovDetalhada } from '../../services/inventoryApi';
import type { VarInfo } from '../../hooks/useInventoryMovements';

interface Props {
  mov: MovDetalhada | null; varInfo: Map<string, VarInfo>; unidadeNome: Map<string, string>;
  custoDe: (v: string) => number; siblings: MovDetalhada[]; onOpenChange: (o: boolean) => void; onOpenMov: (m: MovDetalhada) => void;
}

export function InventoryMovementDrawer({ mov, varInfo, unidadeNome, custoDe, siblings, onOpenChange, onOpenMov }: Props) {
  const doc = useDocumentoViewer();
  return (
    <Sheet open={mov !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-[94vw] flex-col gap-0 p-0 sm:max-w-lg">
        {mov && (() => {
          const meta = tipoMeta(mov.tipo); const Icon = meta.icon; const dir = direcaoMov(mov); const qtd = totalPecas(mov); const valor = valorMov(mov, custoDe);
          return (
            <>
              <SheetHeader className="border-b border-border/60 p-5 pb-4 text-left">
                <div className="flex items-center gap-2"><span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', meta.classe)}><Icon className="h-3 w-3" />{meta.label}</span><span className="font-mono text-sm text-foreground">{mov.numero}</span></div>
                <SheetTitle className="sr-only">Movimentação {mov.numero}</SheetTitle>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTimeBR(mov.createdAt)} · {unidadeNome.get(mov.unidadeId) ?? '—'}</p>
              </SheetHeader>
              <ScrollArea className="min-h-0 flex-1 p-5">
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                  <Campo rot="Direção" val={DIRECAO_LABEL[dir]} />
                  <Campo rot="Origem" val={mov.referenciaTipo ? (ORIGEM_LABEL[mov.referenciaTipo] ?? mov.referenciaTipo) : '—'} />
                  <Campo rot="Responsável" val={mov.operadorNome} />
                  <Campo rot="Total de peças" val={`${dir === 'IN' ? '+' : dir === 'OUT' ? '−' : ''}${formatNumberBR(qtd)}`} />
                  <Campo rot="Itens" val={formatNumberBR(mov.itens.length)} />
                  <Campo rot="Valor estimado" val={valor > 0 ? formatCurrencyBRL(valor) : '—'} />
                </dl>
                {mov.observacao && <p className="mt-3 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">{mov.observacao}</p>}

                {siblings.length > 0 && (
                  <div className="mt-4 rounded-lg border border-[hsl(217_90%_55%)]/30 bg-[hsl(217_90%_55%)]/5 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-[hsl(217_90%_45%)]"><Link2 className="h-3.5 w-3.5" /> Parte de uma operação vinculada (ex.: troca)</p>
                    <ul className="mt-1.5 space-y-1">
                      {siblings.map((s) => (
                        <li key={s.id}><button type="button" onClick={() => onOpenMov(s)} className="flex w-full items-center justify-between gap-2 text-xs hover:opacity-80"><span className="font-mono text-foreground">{s.numero}</span><span className="text-muted-foreground">{tipoMeta(s.tipo).label}</span></button></li>
                      ))}
                    </ul>
                  </div>
                )}

                <p className="mb-2 mt-5 text-xs font-medium text-muted-foreground">Itens</p>
                <ul className="space-y-2">
                  {mov.itens.map((it, i) => { const v = varInfo.get(it.varianteId); const imp = it.quantidade * (v?.custo ?? 0); return (
                    <li key={i} className="rounded-lg border border-border/60 p-2.5 text-sm">
                      <div className="flex items-center justify-between gap-2"><span className="min-w-0 truncate font-medium text-foreground">{v?.nome ?? 'Item'}{v?.tamanho ? ` · ${v.tamanho}` : ''}</span><span className={cn('shrink-0 tabular-nums font-medium', it.direcao === 'IN' ? 'text-success' : 'text-status-warning')}>{it.direcao === 'IN' ? '+' : '−'}{formatNumberBR(it.quantidade)}</span></div>
                      <div className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground"><span className="font-mono">{v?.codigo}</span><span>Saldo {formatNumberBR(it.saldoAnterior)} → {formatNumberBR(it.saldoPosterior)}</span>{imp > 0 && <span>{formatCurrencyBRL(imp)}</span>}</div>
                    </li>
                  ); })}
                </ul>

                {mov.documento && (
                  <div className="mt-4"><p className="mb-2 text-xs font-medium text-muted-foreground">Documentos</p>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => doc.abrir(mov.documento!.storage_key)} disabled={doc.abrindo === mov.documento.storage_key}>{doc.abrindo === mov.documento.storage_key ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} Visualizar nota fiscal</Button>
                  </div>
                )}

                <div className="mt-4 rounded-lg border border-border/60 p-3">
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Auditoria</p>
                  <dl className="grid grid-cols-1 gap-1 text-xs">
                    <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Usuário</dt><dd className="text-foreground">{mov.operadorNome}</dd></div>
                    <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Data</dt><dd className="tabular-nums text-foreground">{formatDateTimeBR(mov.createdAt)}</dd></div>
                    {mov.operacaoId && <div className="flex justify-between gap-2"><dt className="text-muted-foreground">Operação</dt><dd className="font-mono text-foreground">{mov.operacaoId.slice(0, 8)}…</dd></div>}
                  </dl>
                </div>

                <Button asChild variant="ghost" size="sm" className="mt-4 gap-1.5"><Link to="/controle-estoque/movimentacoes"><ArrowLeftRight className="h-4 w-4" /> Ir para movimentações</Link></Button>
              </ScrollArea>
            </>
          );
        })()}
      </SheetContent>
    </Sheet>
  );
}

function Campo({ rot, val }: { rot: string; val: string }) { return <div><dt className="text-xs text-muted-foreground">{rot}</dt><dd className="font-medium text-foreground">{val}</dd></div>; }
