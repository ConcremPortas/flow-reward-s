import { Link } from 'react-router-dom';
import { ChevronRight, Info } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge } from '@/components/app/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import { STOCK_STATUS_LABEL } from '../../domain/stockStatus';
import { MOVEMENT_TYPE_LABEL, MOVEMENT_IS_ENTRADA } from '../../domain/domainConstants';
import type { StockStatus } from '../../types/inventory.types';
import type { SaldoUnidade } from '../../types/db.types';
import type { MovVariante } from '../../services/inventoryApi';

const VAR: Record<StockStatus, 'success' | 'warning' | 'danger'> = { NORMAL: 'success', ALERTA: 'warning', SEM_ESTOQUE: 'danger' };

export function OtherUnitsBalance({ outras, onAbrirItem }: { outras: SaldoUnidade[]; onAbrirItem?: () => void }) {
  return (
    <SectionCard title="Saldo em outras unidades"
      actions={onAbrirItem ? <button type="button" onClick={onAbrirItem} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Abrir item <ChevronRight className="h-3.5 w-3.5" /></button> : undefined}>
      {outras.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Este item não possui saldo em outras unidades.</p>
      ) : (
        <>
          <ul className="divide-y divide-border/40">
            {outras.map((s) => (
              <li key={s.unidadeId} className="flex items-center justify-between gap-2 py-2 text-sm">
                <span className="min-w-0 truncate text-foreground">{s.unidadeNome}</span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="tabular-nums text-muted-foreground">{formatNumberBR(s.quantidade)} / {formatNumberBR(s.minimoEfetivo)}</span>
                  <StatusBadge variant={VAR[s.status]}>{STOCK_STATUS_LABEL[s.status]}</StatusBadge>
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground"><Info className="h-3.5 w-3.5" /> Estas unidades não serão alteradas por este ajuste.</p>
        </>
      )}
    </SectionCard>
  );
}

export function RecentItemMovements({ movs, loading }: { movs: MovVariante[]; loading: boolean }) {
  return (
    <SectionCard title="Histórico nesta unidade"
      actions={<Link to="/controle-estoque/movimentacoes" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Ver completo <ChevronRight className="h-3.5 w-3.5" /></Link>}>
      {loading ? (
        <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : movs.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma movimentação registrada para este item nesta unidade.</p>
      ) : (
        <ul className="space-y-2">
          {movs.map((m, i) => {
            const entrada = MOVEMENT_IS_ENTRADA[m.tipo as keyof typeof MOVEMENT_IS_ENTRADA] ?? true;
            return (
              <li key={i} className="rounded-lg border border-border/60 p-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5"><StatusBadge variant={entrada ? 'success' : 'warning'}>{MOVEMENT_TYPE_LABEL[m.tipo as keyof typeof MOVEMENT_TYPE_LABEL] ?? m.tipo}</StatusBadge><span className="font-mono text-xs text-muted-foreground">{m.numero}</span></div>
                  <span className={cn('tabular-nums font-medium', entrada ? 'text-success' : 'text-status-warning')}>{m.direcao === 'IN' ? '+' : '−'}{formatNumberBR(m.quantidade)}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-muted-foreground">
                  <span>{formatNumberBR(m.saldoAnterior)} → {formatNumberBR(m.saldoPosterior)}</span>
                  <span>{formatDateTimeBR(m.createdAt)}</span>
                  <span>{m.operadorNome}</span>
                </div>
                {m.observacao && <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{m.observacao}</p>}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
