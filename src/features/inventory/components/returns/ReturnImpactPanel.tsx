import { PackageCheck, Info, ArrowRight } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge } from '@/components/app/StatusBadge';
import { cn } from '@/lib/utils';
import { formatNumberBR, formatCurrencyBRL } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import { RETURN_CONDITION_LABEL, RETURN_DESTINATION_LABEL } from '../../domain/domainConstants';
import type { ReturnCondition, ReturnDestination } from '../../types/inventory.types';
import type { DevolucaoDetalhe } from '../../services/inventoryApi';

interface ImpactProps {
  ativo: boolean; itemNome: string | null; unidadeNome: string | null; qtd: number; qtdValida: boolean;
  reestoca: boolean; saldoAtual: number; saldoFinal: number; impacto: number | null; restante: number;
  destino: ReturnDestination;
}

export function ReturnImpactPanel({ ativo, itemNome, unidadeNome, qtd, qtdValida, reestoca, saldoAtual, saldoFinal, impacto, restante, destino }: ImpactProps) {
  return (
    <SectionCard title="Impacto da devolução" description={ativo ? `${itemNome} · ${unidadeNome}` : 'Prévia do efeito no saldo.'}>
      {!ativo ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Selecione o item e a quantidade para ver o impacto no saldo.</p>
      ) : (
        <div className="space-y-3">
          <div className={cn('rounded-lg border p-3', reestoca ? 'border-success/30 bg-success/5' : 'border-border/60 bg-muted/20')}>
            <div className="flex items-center justify-center gap-2 text-sm tabular-nums">
              <span className="text-muted-foreground">{formatNumberBR(saldoAtual)}</span>
              <ArrowRight className={cn('h-4 w-4', reestoca ? 'text-success' : 'text-muted-foreground')} />
              <span className="text-lg font-bold text-foreground">{formatNumberBR(saldoFinal)}</span>
              <span className="text-xs text-muted-foreground">peças</span>
            </div>
            <div className="mt-1 flex items-center justify-center gap-1.5 text-xs">
              {reestoca ? <><PackageCheck className="h-3.5 w-3.5 text-success" /><span className="font-medium text-success">Retorna ao estoque (+{formatNumberBR(qtdValida ? qtd : 0)})</span></>
                : <><Info className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-muted-foreground">Sem reentrada — encaminhado para {RETURN_DESTINATION_LABEL[destino]}</span></>}
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <Campo rot="Devolução" val={qtdValida ? `${formatNumberBR(qtd)} pç` : '—'} />
            <Campo rot="No saldo" val={reestoca && qtdValida ? `+${formatNumberBR(qtd)}` : '0'} tone={reestoca ? 'pos' : undefined} />
            <Campo rot="Valor estimado" val={impacto != null ? `+${formatCurrencyBRL(impacto)}` : (reestoca ? '—' : 'Não retorna')} />
            <Campo rot="Restante p/ devolver" val={formatNumberBR(Math.max(0, restante))} />
          </dl>
        </div>
      )}
    </SectionCard>
  );
}

export function PreviousReturns({ historico }: { historico: DevolucaoDetalhe[] }) {
  return (
    <SectionCard title="Devoluções desta entrega" description="Histórico de devoluções já registradas.">
      {historico.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma devolução registrada para esta entrega.</p>
      ) : (
        <ul className="space-y-2">
          {historico.map((d) => (
            <li key={d.id} className="rounded-lg border border-border/60 p-2.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate font-medium text-foreground">{d.varianteNome}</span>
                <span className="shrink-0 tabular-nums font-medium">{formatNumberBR(d.quantidade)} pç</span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <StatusBadge variant="neutral">{RETURN_CONDITION_LABEL[d.condicao as ReturnCondition] ?? d.condicao}</StatusBadge>
                <span>→ {RETURN_DESTINATION_LABEL[d.destino as ReturnDestination] ?? d.destino}</span>
                {d.reestocado ? <StatusBadge variant="success">Reestocado</StatusBadge> : <StatusBadge variant="neutral">Sem reentrada</StatusBadge>}
                {d.status === 'ESTORNADA' && <StatusBadge variant="warning">Estornada</StatusBadge>}
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{formatDateTimeBR(d.createdAt)} · {d.responsavel}</div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function Campo({ rot, val, tone }: { rot: string; val: string; tone?: 'pos' }) {
  return <div><dt className="text-xs text-muted-foreground">{rot}</dt><dd className={cn('font-medium tabular-nums', tone === 'pos' ? 'text-success' : 'text-foreground')}>{val}</dd></div>;
}
