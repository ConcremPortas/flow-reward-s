import { FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatNumberBR } from '@/lib/formatters';
import { formatDateBR } from '@/lib/dateTime';
import type { DeliveryItemRow } from '../../hooks/useStockDelivery';
import type { Funcionario } from '@/hooks/useFuncionarios';

interface Props {
  open: boolean; onOpenChange: (o: boolean) => void;
  funcionario: Funcionario | null; unidadeNome: string | null; tipoLabel: string; rows: DeliveryItemRow[];
}

export function ResponsibilityTermPreview({ open, onOpenChange, funcionario, unidadeNome, tipoLabel, rows }: Props) {
  const hoje = new Date().toISOString();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-hidden p-0">
        <DialogHeader className="border-b border-border/60 p-5 pb-4">
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Prévia do termo de responsabilidade</DialogTitle>
          <DialogDescription>Prévia — o termo definitivo (snapshot imutável) é gerado ao confirmar a entrega.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-5">
          {funcionario && (
            <div className="space-y-4 text-sm">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div><dt className="text-xs text-muted-foreground">Colaborador</dt><dd className="font-medium text-foreground">{funcionario.nome}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Empresa</dt><dd className="font-medium text-foreground">{funcionario.empresa?.nome ?? '—'}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Setor</dt><dd className="font-medium text-foreground">{funcionario.setor?.nome ?? '—'}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Cargo/Função</dt><dd className="font-medium text-foreground">{funcionario.funcao?.nome ?? '—'}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Tipo de entrega</dt><dd className="font-medium text-foreground">{tipoLabel}</dd></div>
                <div><dt className="text-xs text-muted-foreground">Data</dt><dd className="font-medium text-foreground">{formatDateBR(hoje)}</dd></div>
              </dl>
              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Itens ({unidadeNome})</p>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-border/60 text-left text-muted-foreground"><th className="pb-1.5 pr-2 font-medium">Item</th><th className="pb-1.5 pr-2 font-medium">Tam.</th><th className="pb-1.5 text-right font-medium">Qtd</th></tr></thead>
                  <tbody>{rows.map((r) => (<tr key={r.varianteId} className="border-b border-border/30 last:border-0"><td className="py-1.5 pr-2 text-foreground">{r.f.variante.nome}</td><td className="py-1.5 pr-2 text-muted-foreground">{r.f.tamanhoRotulo ?? '—'}</td><td className="py-1.5 text-right tabular-nums">{formatNumberBR(r.quantidade)}</td></tr>))}</tbody>
                </table>
              </div>
              <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
                <p className="mb-1 font-medium text-foreground">Texto legal vigente</p>
                Declaro ter recebido os itens de fardamento acima discriminados, comprometendo-me a zelar por sua conservação e a devolvê-los quando solicitado ou no desligamento. <span className="italic">(O texto legal definitivo é aplicado pelo sistema no momento da emissão.)</span>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
