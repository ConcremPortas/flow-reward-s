import { FileText, ArrowRight } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrencyBRL, formatNumberBR } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import type { TrocaDetalhe } from '../../services/inventoryApi';

export function ExchangeFinancialPanel({ ativo, financeiro }: { ativo: boolean; financeiro: { valorDev: number; valorNova: number; diferenca: number; temCusto: boolean } }) {
  return (
    <SectionCard title="Impacto financeiro" description="Custo estimado da troca (não é financeiro oficial).">
      {!ativo ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Selecione os itens e a quantidade para estimar o custo.</p>
      ) : !financeiro.temCusto ? (
        <div className="rounded-lg bg-status-warning/10 px-3 py-2 text-sm text-status-warning">Impacto financeiro incompleto — um dos itens não possui custo cadastrado.</div>
      ) : (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Campo rot="Item devolvido" val={formatCurrencyBRL(financeiro.valorDev)} />
          <Campo rot="Novo item" val={formatCurrencyBRL(financeiro.valorNova)} />
          <div className="col-span-2 flex items-center justify-between border-t border-border/60 pt-2">
            <span className="text-muted-foreground">Diferença estimada</span>
            <span className={cn('font-semibold tabular-nums', financeiro.diferenca > 0 ? 'text-status-warning' : financeiro.diferenca < 0 ? 'text-success' : 'text-foreground')}>{financeiro.diferenca > 0 ? '+' : ''}{formatCurrencyBRL(financeiro.diferenca)}</span>
          </div>
        </dl>
      )}
    </SectionCard>
  );
}

export function PreviousExchanges({ historico }: { historico: TrocaDetalhe[] }) {
  return (
    <SectionCard title="Trocas desta entrega" description="Trocas já registradas para esta entrega.">
      {historico.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma troca registrada para esta entrega.</p>
      ) : (
        <ul className="space-y-2">
          {historico.map((t) => (
            <li key={t.id} className="rounded-lg border border-border/60 p-2.5 text-sm">
              <div className="flex items-center gap-1.5"><span className="min-w-0 truncate font-medium text-foreground">{t.itemAntigo}</span><ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" /><span className="min-w-0 truncate font-medium text-foreground">{t.itemNovo}</span></div>
              <div className="mt-0.5 text-xs text-muted-foreground">{formatNumberBR(t.quantidade)} pç · {t.motivo || '—'}</div>
              <div className="text-[11px] text-muted-foreground">{formatDateTimeBR(t.createdAt)}</div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function ExchangeTermCard({ podeVer, onVer }: { podeVer: boolean; onVer: () => void }) {
  return (
    <SectionCard title="Novo termo de responsabilidade" description="A troca gera uma nova entrega e um novo termo.">
      <p className="text-xs text-muted-foreground">O termo anterior não é apagado; os registros ficam vinculados (devolução, nova entrega e troca).</p>
      <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={onVer} disabled={!podeVer}><FileText className="h-4 w-4" /> Ver prévia do novo termo</Button>
    </SectionCard>
  );
}

function Campo({ rot, val }: { rot: string; val: string }) { return <div><dt className="text-xs text-muted-foreground">{rot}</dt><dd className="font-medium tabular-nums text-foreground">{val}</dd></div>; }
