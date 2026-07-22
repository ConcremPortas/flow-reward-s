import { Minus, Plus, ArrowRight, ArrowLeftRight, PackageCheck, Check, Repeat2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/app/StatusBadge';
import { EmptyState } from '@/components/app/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';
import { StockItemSelector } from '../adjustment/StockItemSelector';
import type { DisponivelItem } from '../../hooks/useStockExchange';
import type { FardamentoRow } from '../../types/db.types';

interface Props {
  hasEntrega: boolean; loadingDisp: boolean; disponiveis: DisponivelItem[]; fardamentos: FardamentoRow[];
  varianteDevolvida: string; setVarianteDevolvida: (id: string) => void; varianteNova: string; setVarianteNova: (id: string) => void;
  fardDevolvida: FardamentoRow | null; fardNova: FardamentoRow | null; unidadeId: string;
  quantidadeRaw: string; setQuantidadeRaw: (v: string) => void; dispQtd: number; qtd: number; qtdValida: boolean; excedeDisp: boolean; excedeSaldo: boolean; saldoNova: number;
  saldoDevolvida: number; saldoDevolvidaFinal: number; saldoNovaFinal: number;
  tamanhoSugerido: string | null; compat: boolean; mesmaVariante: boolean;
  motivo: string; setMotivo: (v: string) => void; motivoMax: number;
}

export function ExchangeForm(p: Props) {
  if (!p.hasEntrega) return <EmptyState icon={Repeat2} title="Selecione uma entrega" description="Escolha a entrega de origem à esquerda para iniciar a troca." />;
  if (p.loadingDisp) return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  if (p.disponiveis.length === 0) return <EmptyState icon={PackageCheck} title="Nada disponível" description="Todos os itens desta entrega já foram devolvidos ou trocados." />;

  const saldoDe = (f: FardamentoRow) => f.saldos.find((s) => s.unidadeId === p.unidadeId)?.quantidade ?? 0;
  const restante = p.qtdValida ? p.dispQtd - p.qtd : p.dispQtd;

  return (
    <div className="space-y-5">
      {/* Item a devolver */}
      <div>
        <Label className="mb-2 block text-sm">Item a devolver *</Label>
        <ul className="space-y-2">
          {p.disponiveis.map((d) => { const zerado = d.disponivel <= 0; const on = p.varianteDevolvida === d.varianteId; return (
            <li key={d.varianteId}>
              <button type="button" disabled={zerado} onClick={() => p.setVarianteDevolvida(d.varianteId)}
                className={cn('w-full rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', on ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border/60 hover:bg-muted/40', zerado && 'cursor-not-allowed opacity-60')}>
                <div className="flex items-center justify-between gap-2"><span className="min-w-0"><span className="block truncate text-sm font-medium text-foreground">{d.nome}</span><span className="block truncate font-mono text-xs text-muted-foreground">{d.codigo}</span></span>
                  {zerado ? <StatusBadge variant="neutral">Concluída</StatusBadge> : <StatusBadge variant="success">{formatNumberBR(d.disponivel)} disp.</StatusBadge>}</div>
                <div className="mt-1 text-xs text-muted-foreground">Entregue {formatNumberBR(d.entregue)} · devolvido/trocado {formatNumberBR(d.devolvido)}</div>
              </button>
            </li>
          ); })}
        </ul>
      </div>

      {p.varianteDevolvida && (
        <>
          {/* Novo item */}
          <div className="space-y-1.5">
            <Label className="text-sm">Novo item a entregar *</Label>
            <StockItemSelector fardamentos={p.fardamentos} value={p.varianteNova} onChange={p.setVarianteNova}
              placeholder="Buscar o novo item (nome, código, categoria...)" saldoDe={saldoDe} ocultarIds={new Set([p.varianteDevolvida])} />
            {p.mesmaVariante && <p className="text-xs text-destructive">O novo item deve ser diferente do item devolvido.</p>}
            {p.varianteNova && p.tamanhoSugerido && (p.compat
              ? <p className="flex items-center gap-1 text-xs text-success"><Check className="h-3.5 w-3.5" /> Tamanho recomendado para o colaborador ({p.tamanhoSugerido}).</p>
              : <p className="text-xs text-status-warning">Tamanho {p.fardNova?.tamanhoRotulo} difere do cadastrado do colaborador ({p.tamanhoSugerido}).</p>)}
          </div>

          {/* Comparação */}
          {p.varianteNova && !p.mesmaVariante && (
            <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
              <BlocoItem tone="success" titulo="Item devolvido" f={p.fardDevolvida} saldoAtual={p.saldoDevolvida} saldoFinal={p.saldoDevolvidaFinal} delta={p.qtdValida ? p.qtd : 0} entrada />
              <div className="flex flex-col items-center justify-center px-1 text-center">
                <ArrowLeftRight className="h-5 w-5 text-primary" /><span className="mt-1 text-[10px] font-medium text-muted-foreground">Troca única</span>
              </div>
              <BlocoItem tone="info" titulo="Novo item" f={p.fardNova} saldoAtual={p.saldoNova} saldoFinal={p.saldoNovaFinal} delta={p.qtdValida ? p.qtd : 0} entrada={false} />
            </div>
          )}

          {/* Quantidade */}
          <div className="space-y-1.5">
            <Label htmlFor="qtd-troca" className="text-sm">Quantidade da troca *</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => p.setQuantidadeRaw(String(Math.max(1, (Number(p.quantidadeRaw) || 1) - 1)))} aria-label="Diminuir"><Minus className="h-4 w-4" /></Button>
              <Input id="qtd-troca" type="number" inputMode="numeric" min={1} step={1} value={p.quantidadeRaw} onChange={(e) => p.setQuantidadeRaw(e.target.value)}
                className={cn('h-9 w-24 text-center tabular-nums', (p.excedeDisp || p.excedeSaldo) && 'border-destructive focus-visible:ring-destructive')} />
              <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => p.setQuantidadeRaw(String((Number(p.quantidadeRaw) || 0) + 1))} aria-label="Aumentar"><Plus className="h-4 w-4" /></Button>
              <span className="text-sm text-muted-foreground">disponível <strong className="tabular-nums text-foreground">{formatNumberBR(p.dispQtd)}</strong> · restam <strong className="tabular-nums text-foreground">{formatNumberBR(Math.max(0, restante))}</strong></span>
            </div>
            {p.excedeDisp && <p className="text-xs text-destructive">Quantidade maior que o disponível para troca ({formatNumberBR(p.dispQtd)}).</p>}
            {p.excedeSaldo && !p.excedeDisp && <p className="text-xs text-destructive">Saldo insuficiente do novo item nesta unidade ({formatNumberBR(p.saldoNova)}).</p>}
          </div>

          {/* Motivo */}
          <div className="space-y-1.5">
            <Label htmlFor="motivo-troca" className="text-sm">Motivo da troca *</Label>
            <Textarea id="motivo-troca" rows={2} maxLength={p.motivoMax} value={p.motivo} onChange={(e) => p.setMotivo(e.target.value)}
              placeholder="Ex.: troca de tamanho; defeito de fabricação; item entregue incorretamente; ajuste de modelo..." aria-invalid={p.motivo.trim().length > 0 && p.motivo.trim().length < 3} />
            <div className="flex items-center justify-between text-xs text-muted-foreground"><span>Ficará registrado na troca, nova entrega e auditoria.</span><span className="tabular-nums">{p.motivo.length}/{p.motivoMax}</span></div>
          </div>
        </>
      )}
    </div>
  );
}

function BlocoItem({ tone, titulo, f, saldoAtual, saldoFinal, delta, entrada }: { tone: 'success' | 'info'; titulo: string; f: FardamentoRow | null; saldoAtual: number; saldoFinal: number; delta: number; entrada: boolean }) {
  const border = tone === 'success' ? 'border-success/30 bg-success/5' : 'border-[hsl(217_90%_55%)]/30 bg-[hsl(217_90%_55%)]/5';
  const col = tone === 'success' ? 'text-success' : 'text-[hsl(217_90%_45%)]';
  return (
    <div className={cn('rounded-lg border p-3', border)}>
      <div className="text-[11px] font-medium text-muted-foreground">{titulo}</div>
      <div className="mt-0.5 truncate text-sm font-medium text-foreground">{f?.variante.nome ?? '—'}</div>
      <div className="truncate text-xs text-muted-foreground">{f?.variante.codigo_interno}{f?.tamanhoRotulo ? ` · ${f.tamanhoRotulo}` : ''}</div>
      <div className="mt-2 flex items-center gap-1.5 text-sm tabular-nums"><span className="text-muted-foreground">{formatNumberBR(saldoAtual)}</span><ArrowRight className={cn('h-3.5 w-3.5', col)} /><span className="font-semibold text-foreground">{formatNumberBR(saldoFinal)}</span></div>
      <div className={cn('text-xs font-medium', col)}>{entrada ? `Devolve +${formatNumberBR(delta)} ao estoque` : `Entrega −${formatNumberBR(delta)} do estoque`}</div>
    </div>
  );
}
