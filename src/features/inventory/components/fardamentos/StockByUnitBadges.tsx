import { StatusBadge, type StatusVariant } from '@/components/app/StatusBadge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatNumberBR } from '@/lib/formatters';
import { STOCK_STATUS_LABEL } from '../../domain/stockStatus';
import type { SaldoUnidade } from '../../types/db.types';

const VAR: Record<string, StatusVariant> = { SEM_ESTOQUE: 'danger', ALERTA: 'warning', NORMAL: 'success' };
const MAX_VISIVEL = 3;

/** Badges de saldo por unidade (até 3) + "+N" com tooltip da distribuição completa. */
export function StockByUnitBadges({ saldos }: { saldos: SaldoUnidade[] }) {
  if (saldos.length === 0) return <span className="text-xs text-muted-foreground">Sem saldo registrado</span>;

  const ordenados = [...saldos].sort((a, b) => b.quantidade - a.quantidade);
  const visiveis = ordenados.slice(0, MAX_VISIVEL);
  const restantes = ordenados.slice(MAX_VISIVEL);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="flex flex-wrap items-center gap-1.5">
        {visiveis.map((s) => (
          <Tooltip key={s.unidadeId}>
            <TooltipTrigger asChild>
              <span><StatusBadge variant={VAR[s.status] ?? 'neutral'}>{s.unidadeNome}: {formatNumberBR(s.quantidade)}</StatusBadge></span>
            </TooltipTrigger>
            <TooltipContent>{s.unidadeNome} — {formatNumberBR(s.quantidade)} un. · {STOCK_STATUS_LABEL[s.status]} (mín. {formatNumberBR(s.minimoEfetivo)})</TooltipContent>
          </Tooltip>
        ))}
        {restantes.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span><StatusBadge variant="neutral">+{restantes.length} {restantes.length === 1 ? 'unidade' : 'unidades'}</StatusBadge></span>
            </TooltipTrigger>
            <TooltipContent>
              <ul className="space-y-0.5">
                {restantes.map((s) => (
                  <li key={s.unidadeId} className="tabular-nums">{s.unidadeNome}: {formatNumberBR(s.quantidade)} ({STOCK_STATUS_LABEL[s.status]})</li>
                ))}
              </ul>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}
