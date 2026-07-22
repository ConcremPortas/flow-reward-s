import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, ShieldCheck, Printer, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { formatNumberBR, formatCurrencyBRL } from '@/lib/formatters';
import { imprimirRecibo } from '../../services/reciboImpressao';
import type { DeliveryItemRow } from '../../hooks/useStockDelivery';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { ReciboEntrega } from '../../services/inventoryApi';

interface RevProps {
  open: boolean; onOpenChange: (o: boolean) => void; saving: boolean; onConfirm: () => void;
  funcionario: Funcionario | null; unidadeNome: string | null; tipoLabel: string; rows: DeliveryItemRow[];
  totais: { pecas: number; valor: number }; valorCompra: string; temCompra: boolean; observacao: string; usuario: string;
}

export function StockDeliveryReviewDialog({ open, onOpenChange, saving, onConfirm, funcionario, unidadeNome, tipoLabel, rows, totais, valorCompra, temCompra, observacao, usuario }: RevProps) {
  const [ok, setOk] = useState(false);
  useEffect(() => { if (open) setOk(false); }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Revisar entrega</DialogTitle>
          <DialogDescription>A operação baixará o saldo da unidade, gerará uma movimentação de saída e emitirá um termo de responsabilidade.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Campo rot="Colaborador" val={funcionario?.nome ?? '—'} />
            <Campo rot="Empresa" val={funcionario?.empresa?.nome ?? '—'} />
            <Campo rot="Unidade" val={unidadeNome ?? '—'} />
            <Campo rot="Tipo" val={tipoLabel} />
            <Campo rot="Total de peças" val={`−${formatNumberBR(totais.pecas)}`} />
            <Campo rot="Valor estimado" val={totais.valor > 0 ? formatCurrencyBRL(totais.valor) : 'Indisponível'} />
            {temCompra && <Campo rot="Valor da compra" val={formatCurrencyBRL(Number(valorCompra) || 0)} />}
            <Campo rot="Responsável" val={usuario} />
          </dl>
          <div className="rounded-lg border border-border/60">
            <div className="border-b border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">{rows.length} {rows.length === 1 ? 'item' : 'itens'}</div>
            <ul className="max-h-48 divide-y divide-border/40 overflow-y-auto">
              {rows.map((r) => (
                <li key={r.varianteId} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                  <span className="min-w-0 truncate text-foreground">{r.f.variante.nome}{r.f.tamanhoRotulo ? ` · ${r.f.tamanhoRotulo}` : ''}</span>
                  <span className="flex shrink-0 items-center gap-1 tabular-nums text-muted-foreground">{formatNumberBR(r.saldo)}<ArrowRight className="h-3 w-3" />{formatNumberBR(r.saldoFinal)} <span className="font-semibold text-status-warning">−{formatNumberBR(r.quantidade)}</span></span>
                </li>
              ))}
            </ul>
          </div>
          {observacao.trim() && <div className="rounded-lg bg-muted/40 p-2.5"><p className="text-xs text-muted-foreground">Observação</p><p className="text-sm text-foreground">{observacao.trim()}</p></div>}
          <p className="flex items-start gap-2 rounded-lg border border-[hsl(217_90%_55%)]/30 bg-[hsl(217_90%_55%)]/5 px-3 py-2 text-xs text-foreground/90"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(217_90%_45%)]" /> Operação transacional com termo imutável; em caso de falha, nada é aplicado.</p>
          <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground"><Checkbox checked={ok} onCheckedChange={(v) => setOk(Boolean(v))} className="mt-0.5" /> Confirmo que os itens e quantidades foram conferidos com o colaborador.</label>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Voltar</Button>
          <Button onClick={onConfirm} disabled={saving || !ok}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirmar entrega</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function StockDeliverySuccessDialog({ recibo, onOpenChange, onNova, onVerMovimentacoes, onVoltar }: {
  recibo: ReciboEntrega | null; onOpenChange: (o: boolean) => void; onNova: () => void; onVerMovimentacoes: () => void; onVoltar: () => void;
}) {
  const totalPecas = recibo ? recibo.itens.reduce((a, it) => a + it.quantidade, 0) : 0;
  return (
    <Dialog open={recibo !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-success" /> Entrega registrada</DialogTitle>
          <DialogDescription>Saldo baixado, movimentação registrada e termo de responsabilidade emitido.</DialogDescription>
        </DialogHeader>
        {recibo && (
          <div className="space-y-3">
            <div className="rounded-lg border border-border/70 bg-muted/20 p-3 text-sm">
              <div className="flex items-center justify-between gap-2"><span className="font-mono font-medium text-primary">{recibo.recibo}</span><span className="text-xs text-muted-foreground">{recibo.unidadeNome}</span></div>
              <div className="mt-1 truncate font-medium text-foreground">{recibo.colaboradorNome}</div>
              <div className="mt-2 flex items-center gap-4 text-sm"><span><strong className="tabular-nums">{formatNumberBR(recibo.itens.length)}</strong> itens</span><span className="text-status-warning"><strong className="tabular-nums">−{formatNumberBR(totalPecas)}</strong> peças</span></div>
            </div>
            <Button className="w-full gap-2" onClick={() => imprimirRecibo(recibo, recibo.operadorNome)}><Printer className="h-4 w-4" /> Emitir recibo</Button>
          </div>
        )}
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="ghost" onClick={onVoltar}>Fardamentos</Button>
          <Button variant="outline" onClick={onVerMovimentacoes}>Ver movimentações</Button>
          <Button variant="outline" onClick={onNova}>Nova entrega</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Campo({ rot, val }: { rot: string; val: string }) {
  return <div><dt className="text-xs text-muted-foreground">{rot}</dt><dd className="truncate font-medium text-foreground">{val}</dd></div>;
}
