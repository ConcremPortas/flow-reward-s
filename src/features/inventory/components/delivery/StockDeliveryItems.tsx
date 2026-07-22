import { Minus, Plus, Trash2, ArrowRight, PackageOpen, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StatusBadge } from '@/components/app/StatusBadge';
import { cn } from '@/lib/utils';
import { formatNumberBR, formatCurrencyBRL } from '@/lib/formatters';
import { StockItemSelector } from '../adjustment/StockItemSelector';
import type { DeliveryItemRow } from '../../hooks/useStockDelivery';
import type { FardamentoRow } from '../../types/db.types';

interface Props {
  fardamentos: FardamentoRow[]; unidadeId: string; jaAdicionados: Set<string>;
  rows: DeliveryItemRow[]; totais: { distintos: number; pecas: number; valor: number; semCusto: number };
  onAdd: (id: string) => void; onSetQtd: (id: string, v: string) => void; onRemove: (id: string) => void;
}

export function StockDeliveryItems({ fardamentos, unidadeId, jaAdicionados, rows, totais, onAdd, onSetQtd, onRemove }: Props) {
  const ativo = !!unidadeId;
  const saldoDe = (f: FardamentoRow) => f.saldos.find((s) => s.unidadeId === unidadeId)?.quantidade ?? 0;

  return (
    <div className="space-y-4">
      <div>
        {!ativo && <p className="mb-1.5 text-xs text-muted-foreground">Selecione a unidade de estoque para adicionar itens.</p>}
        <StockItemSelector fardamentos={fardamentos} value="" onChange={onAdd} disabled={!ativo}
          placeholder="Adicionar item a entregar (nome, código, categoria...)" saldoDe={saldoDe} ocultarIds={jaAdicionados} />
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/70 py-8 text-center">
          <PackageOpen className="h-7 w-7 text-muted-foreground" /><p className="text-sm text-muted-foreground">Nenhum item adicionado ainda.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {rows.map((r) => (
            <li key={r.varianteId} className={cn('rounded-lg border bg-card p-3', r.excede ? 'border-destructive/40' : 'border-border/70')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5"><span className="truncate text-sm font-medium text-foreground">{r.f.variante.nome}</span>
                    {r.tamanhoSugerido && (r.compat ? <StatusBadge variant="success"><Check className="mr-0.5 h-3 w-3" />Tam. recomendado</StatusBadge> : <StatusBadge variant="warning">≠ {r.tamanhoSugerido}</StatusBadge>)}
                  </div>
                  <div className="truncate text-xs text-muted-foreground"><span className="font-mono">{r.f.variante.codigo_interno}</span>{r.f.categoriaNome ? ` · ${r.f.categoriaNome}` : ''}{r.f.tamanhoRotulo ? ` · ${r.f.tamanhoRotulo}` : ''}</div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => onRemove(r.varianteId)} aria-label={`Remover ${r.f.variante.nome}`}><Trash2 className="h-4 w-4" /></Button>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => onSetQtd(r.varianteId, String(Math.max(1, (Number(r.quantidadeRaw) || 1) - 1)))} aria-label="Diminuir"><Minus className="h-3.5 w-3.5" /></Button>
                  <Input type="number" inputMode="numeric" min={1} step={1} value={r.quantidadeRaw} onChange={(e) => onSetQtd(r.varianteId, e.target.value)}
                    className={cn('h-8 w-20 text-center tabular-nums', !r.valida && 'border-destructive focus-visible:ring-destructive')} aria-label={`Quantidade de ${r.f.variante.nome}`} />
                  <Button type="button" variant="outline" size="icon" className="h-8 w-8" onClick={() => onSetQtd(r.varianteId, String((Number(r.quantidadeRaw) || 0) + 1))} aria-label="Aumentar"><Plus className="h-3.5 w-3.5" /></Button>
                  <span className="text-xs text-muted-foreground">peças</span>
                </div>
                <div className="flex items-center gap-2 text-sm tabular-nums">
                  <span className="text-muted-foreground">Disp. {formatNumberBR(r.saldo)}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-status-warning" />
                  <span className={cn('font-semibold', r.excede ? 'text-destructive' : 'text-foreground')}>{formatNumberBR(r.saldoFinal)}</span>
                  <span className="font-medium text-status-warning">(−{formatNumberBR(r.quantidade)})</span>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{r.impacto != null ? `Custo: ${formatCurrencyBRL(r.impacto)}` : 'Custo não cadastrado'}</span>
                {r.excede ? <span className="font-medium text-destructive">Saldo insuficiente nesta unidade</span> : !r.valida ? <span className="text-destructive">Quantidade inválida</span> : null}
              </div>
            </li>
          ))}
        </ul>
      )}

      {rows.length > 0 && (
        <div aria-live="polite" className="grid grid-cols-3 gap-2 rounded-lg border border-border/60 bg-muted/20 p-3 text-center">
          <Tot rot="Itens" val={formatNumberBR(totais.distintos)} />
          <Tot rot="Peças" val={formatNumberBR(totais.pecas)} />
          <Tot rot="Valor estimado" val={totais.valor > 0 ? formatCurrencyBRL(totais.valor) : '—'} />
        </div>
      )}
    </div>
  );
}

function Tot({ rot, val }: { rot: string; val: string }) {
  return <div><div className="text-base font-bold tabular-nums text-foreground">{val}</div><div className="text-[11px] text-muted-foreground">{rot}</div></div>;
}
