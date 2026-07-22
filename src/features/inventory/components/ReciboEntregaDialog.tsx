import { useEffect, useState } from 'react';
import { Printer, ReceiptText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrencyBRL, formatNumberBR } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import { DELIVERY_TYPE_LABEL } from '../domain/domainConstants';
import { imprimirRecibo } from '../services/reciboImpressao';
import type { DeliveryType } from '../types/inventory.types';
import type { ReciboEntrega } from '../services/inventoryApi';

interface Props {
  recibo: ReciboEntrega | null;
  onOpenChange: (o: boolean) => void;
}

/** Emissão/impressão do recibo de entrega, sob demanda. "Entregue por" é editável. */
export function ReciboEntregaDialog({ recibo, onOpenChange }: Props) {
  const [entreguePor, setEntreguePor] = useState('');

  // Ao abrir para uma entrega, sugere o operador como quem entregou (editável).
  useEffect(() => { if (recibo) setEntreguePor(recibo.operadorNome); }, [recibo]);

  const total = recibo ? recibo.itens.reduce((s, it) => s + it.quantidade * it.custoUnitario, 0) : 0;
  const tipoLabel = recibo ? (DELIVERY_TYPE_LABEL[recibo.tipo as DeliveryType] ?? recibo.tipo) : '';

  return (
    <Dialog open={recibo !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ReceiptText className="h-5 w-5 text-primary" /> Recibo de entrega
          </DialogTitle>
          <DialogDescription>Confira os dados, informe quem entregou e imprima para colher a assinatura.</DialogDescription>
        </DialogHeader>

        {recibo && (
          <div className="space-y-3 rounded-lg border border-border/70 bg-muted/20 p-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Recibo</span>
              <span className="font-semibold text-primary">Nº {recibo.recibo}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
              <Linha rot="Colaborador" val={recibo.colaboradorNome} />
              <Linha rot="Data" val={formatDateTimeBR(recibo.createdAt)} />
              <Linha rot="Tipo" val={tipoLabel} />
              <Linha rot="Local de estoque" val={recibo.unidadeNome} />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border/60 text-left text-muted-foreground">
                    <th className="pb-1.5 pr-2 font-medium">Código</th>
                    <th className="pb-1.5 pr-2 font-medium">Uniforme</th>
                    <th className="pb-1.5 pr-2 text-right font-medium">Qtd</th>
                    <th className="pb-1.5 text-right font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {recibo.itens.map((it, i) => (
                    <tr key={i} className="border-b border-border/30 last:border-0">
                      <td className="py-1.5 pr-2 font-mono">{it.codigo}</td>
                      <td className="py-1.5 pr-2 text-foreground">{it.nome}</td>
                      <td className="py-1.5 pr-2 text-right tabular-nums">{formatNumberBR(it.quantidade)}</td>
                      <td className="py-1.5 text-right tabular-nums">{formatCurrencyBRL(it.quantidade * it.custoUnitario)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t border-border/60 pt-2 font-medium">
              <span className="text-muted-foreground">Valor total</span>
              <span className="tabular-nums">{formatCurrencyBRL(total)}</span>
            </div>
            <div className="grid grid-cols-2 items-end gap-x-4 gap-y-2 pt-1">
              <Linha rot="Emitido por" val={recibo.operadorNome} />
              <div className="space-y-1">
                <Label htmlFor="entregue-por" className="text-xs text-muted-foreground">Entregue por</Label>
                <Input id="entregue-por" className="h-8" value={entreguePor} onChange={(e) => setEntreguePor(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        <div className="mt-1 flex items-center justify-end gap-2 border-t border-border/60 pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button className="gap-2" onClick={() => { if (recibo) imprimirRecibo(recibo, entreguePor); }}>
            <Printer className="h-4 w-4" /> Imprimir recibo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Linha({ rot, val }: { rot: string; val: string }) {
  return <div><span className="text-muted-foreground">{rot}: </span><span className="font-medium text-foreground">{val}</span></div>;
}
