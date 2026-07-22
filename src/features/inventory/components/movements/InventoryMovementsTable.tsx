import { useState, Fragment } from 'react';
import { ChevronDown, ChevronRight, FileText, Eye, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/app/StatusBadge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import { tipoMeta, direcaoMov, totalPecas, ORIGEM_LABEL, type Direcao } from './movementMeta';
import type { MovDetalhada } from '../../services/inventoryApi';
import type { VarInfo } from '../../hooks/useInventoryMovements';

interface Props {
  pagina: MovDetalhada[]; varInfo: Map<string, VarInfo>; unidadeNome: Map<string, string>; operacaoMap: Map<string, string[]>;
  onOpen: (m: MovDetalhada) => void;
  page: number; setPage: (n: number) => void; pageSize: number; setPageSize: (n: number) => void; totalPaginas: number; total: number;
}

const DIR_ICON: Record<Direcao, typeof ArrowDownToLine> = { IN: ArrowDownToLine, OUT: ArrowUpFromLine, MISTA: ArrowLeftRight };

export function InventoryMovementsTable({ pagina, varInfo, unidadeNome, operacaoMap, onOpen, page, setPage, pageSize, setPageSize, totalPaginas, total }: Props) {
  const [exp, setExp] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setExp((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const de = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const ate = Math.min(page * pageSize, total);

  return (
    <div>
      {/* Desktop */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
              <th className="w-8 pb-2.5" /><th className="pb-2.5 pr-3 font-medium">Número</th><th className="pb-2.5 pr-3 font-medium">Tipo</th>
              <th className="pb-2.5 pr-3 font-medium">Data</th><th className="pb-2.5 pr-3 font-medium">Local</th><th className="pb-2.5 pr-3 font-medium">Itens</th>
              <th className="pb-2.5 pr-3 text-right font-medium">Qtd</th><th className="pb-2.5 pr-3 font-medium">Origem</th>
              <th className="pb-2.5 pr-3 font-medium">Responsável</th><th className="pb-2.5 pr-3 font-medium">Doc</th><th className="pb-2.5 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pagina.map((m) => {
              const meta = tipoMeta(m.tipo); const Icon = meta.icon; const dir = direcaoMov(m); const DIcon = DIR_ICON[dir]; const qtd = totalPecas(m);
              const primeiro = m.itens[0]; const extra = m.itens.length - 1;
              const sib = m.operacaoId ? (operacaoMap.get(m.operacaoId)?.length ?? 1) : 1;
              const aberto = exp.has(m.id);
              return (
                <Fragment key={m.id}>
                  <tr className="cursor-pointer border-b border-border/40 align-middle transition-colors hover:bg-muted/40" onClick={() => onOpen(m)}>
                    <td className="py-2.5"><button type="button" onClick={(e) => { e.stopPropagation(); toggle(m.id); }} aria-expanded={aberto} aria-label={aberto ? 'Recolher itens' : 'Expandir itens'} className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted">{aberto ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</button></td>
                    <td className="py-2.5 pr-3"><span className="font-mono text-xs font-medium text-foreground">{m.numero}</span>{sib > 1 && <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] text-primary" title="Parte de uma operação vinculada (ex.: troca)"><Link2 className="h-3 w-3" /></span>}</td>
                    <td className="py-2.5 pr-3"><span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', meta.classe)}><Icon className="h-3 w-3" />{meta.label}</span></td>
                    <td className="py-2.5 pr-3 text-xs tabular-nums text-muted-foreground">{formatDateTimeBR(m.createdAt)}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{unidadeNome.get(m.unidadeId) ?? '—'}</td>
                    <td className="py-2.5 pr-3 text-muted-foreground">{primeiro ? <span className="truncate">{varInfo.get(primeiro.varianteId)?.nome ?? 'Item'}{extra > 0 && <span className="text-xs"> +{extra}</span>}</span> : '—'}</td>
                    <td className={cn('py-2.5 pr-3 text-right tabular-nums font-medium', dir === 'IN' ? 'text-success' : dir === 'OUT' ? 'text-status-warning' : 'text-foreground')}>{dir === 'IN' ? '+' : dir === 'OUT' ? '−' : ''}{formatNumberBR(qtd)}</td>
                    <td className="py-2.5 pr-3"><span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><DIcon className="h-3 w-3" />{m.referenciaTipo ? (ORIGEM_LABEL[m.referenciaTipo] ?? m.referenciaTipo) : '—'}</span></td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">{m.operadorNome}</td>
                    <td className="py-2.5 pr-3">{m.documento ? <FileText className="h-4 w-4 text-primary" aria-label="Nota fiscal anexada" /> : <span className="text-xs text-muted-foreground">—</span>}</td>
                    <td className="py-2.5 text-right"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); onOpen(m); }} aria-label="Detalhes"><Eye className="h-4 w-4" /></Button></td>
                  </tr>
                  {aberto && (
                    <tr className="border-b border-border/40 bg-muted/20">
                      <td /><td colSpan={10} className="py-2.5 pr-3">
                        <ul className="space-y-1.5">
                          {m.itens.map((it, i) => { const v = varInfo.get(it.varianteId); return (
                            <li key={i} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="text-foreground">{v?.nome ?? 'Item'}{v?.tamanho ? ` · ${v.tamanho}` : ''} <span className="font-mono text-muted-foreground">{v?.codigo}</span></span>
                              <span className="flex items-center gap-3 tabular-nums text-muted-foreground"><span>Saldo {formatNumberBR(it.saldoAnterior)} → {formatNumberBR(it.saldoPosterior)}</span><span className={cn('font-medium', it.direcao === 'IN' ? 'text-success' : 'text-status-warning')}>{it.direcao === 'IN' ? '+' : '−'}{formatNumberBR(it.quantidade)}</span></span>
                            </li>
                          ); })}
                        </ul>
                        {m.observacao && <p className="mt-1.5 text-xs text-muted-foreground">Obs.: {m.observacao}</p>}
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="space-y-2.5 lg:hidden">
        {pagina.map((m) => { const meta = tipoMeta(m.tipo); const Icon = meta.icon; const dir = direcaoMov(m); const qtd = totalPecas(m); return (
          <button key={m.id} type="button" onClick={() => onOpen(m)} className="w-full rounded-xl border border-border/70 bg-card p-3 text-left shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between gap-2"><span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', meta.classe)}><Icon className="h-3 w-3" />{meta.label}</span><span className={cn('text-sm font-bold tabular-nums', dir === 'IN' ? 'text-success' : dir === 'OUT' ? 'text-status-warning' : 'text-foreground')}>{dir === 'IN' ? '+' : dir === 'OUT' ? '−' : ''}{formatNumberBR(qtd)}</span></div>
            <div className="mt-1 font-mono text-xs text-foreground">{m.numero}</div>
            <div className="text-xs text-muted-foreground">{unidadeNome.get(m.unidadeId) ?? '—'} · {m.itens.length} itens · {formatDateTimeBR(m.createdAt)}</div>
            <div className="text-[11px] text-muted-foreground">{m.operadorNome}{m.documento ? ' · NF' : ''}</div>
          </button>
        ); })}
      </div>

      {/* Paginação */}
      <div className="mt-4 flex flex-col items-center justify-between gap-3 border-t border-border/60 pt-3 text-sm sm:flex-row">
        <span className="text-xs text-muted-foreground">{de}–{ate} de {formatNumberBR(total)}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5"><span className="text-xs text-muted-foreground">Por página</span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}><SelectTrigger className="h-8 w-16"><SelectValue /></SelectTrigger><SelectContent>{[25, 50, 100].map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}</SelectContent></Select>
          </div>
          <div className="flex items-center gap-1"><Button variant="outline" size="sm" className="h-8" onClick={() => setPage(Math.max(1, page - 1))} disabled={page <= 1}>Anterior</Button><span className="px-1 text-xs tabular-nums text-muted-foreground">{page}/{totalPaginas}</span><Button variant="outline" size="sm" className="h-8" onClick={() => setPage(Math.min(totalPaginas, page + 1))} disabled={page >= totalPaginas}>Próxima</Button></div>
        </div>
      </div>
    </div>
  );
}
