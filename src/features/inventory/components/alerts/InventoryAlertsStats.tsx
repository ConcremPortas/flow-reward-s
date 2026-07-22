import { XCircle, AlertOctagon, AlertTriangle, Bell, Building2, ListChecks, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';
import type { Severidade } from './severity';

interface Stats { semEstoque: number; criticos: number; abaixoMin: number; proximos: number; semMinimo: number; total: number; unidadesAfetadas: number; totalUnidades: number }

interface Props {
  stats: Stats; loading: boolean; ativo: Severidade | '';
  onFiltrar: (s: Severidade | '') => void;
  onVerUnidades: () => void;
}

type Tone = 'default' | 'warn' | 'danger' | 'info';

export function InventoryAlertsStats({ stats, loading, ativo, onFiltrar, onVerUnidades }: Props) {
  const cards: { key: string; icon: LucideIcon; tone: Tone; label: string; value: number; sec: string; tip: string; onClick: () => void; on: boolean }[] = [
    { key: 'sem', icon: XCircle, tone: 'danger', label: 'Sem estoque', value: stats.semEstoque, sec: 'Saldo zerado', tip: 'Itens com saldo zero em alguma unidade. Clique para filtrar.', onClick: () => onFiltrar(ativo === 'SEM_ESTOQUE' ? '' : 'SEM_ESTOQUE'), on: ativo === 'SEM_ESTOQUE' },
    { key: 'crit', icon: AlertOctagon, tone: 'danger', label: 'Críticos', value: stats.criticos, sec: 'Saldo até 25% do mínimo', tip: 'Saldo positivo, porém ≤ 25% do mínimo. Clique para filtrar.', onClick: () => onFiltrar(ativo === 'CRITICO' ? '' : 'CRITICO'), on: ativo === 'CRITICO' },
    { key: 'abaixo', icon: AlertTriangle, tone: 'warn', label: 'Abaixo do mínimo', value: stats.abaixoMin, sec: 'Precisam de reposição', tip: 'Saldo entre 25% e 100% do mínimo. Clique para filtrar.', onClick: () => onFiltrar(ativo === 'ABAIXO_MIN' ? '' : 'ABAIXO_MIN'), on: ativo === 'ABAIXO_MIN' },
    { key: 'prox', icon: Bell, tone: 'info', label: 'Próximos do mínimo', value: stats.proximos, sec: 'Até 25% acima do mínimo', tip: 'Alerta antecipado: saldo pouco acima do mínimo. Clique para filtrar.', onClick: () => onFiltrar(ativo === 'PROXIMO' ? '' : 'PROXIMO'), on: ativo === 'PROXIMO' },
    { key: 'unid', icon: Building2, tone: 'default', label: 'Unidades afetadas', value: stats.unidadesAfetadas, sec: `de ${formatNumberBR(stats.totalUnidades)} ${stats.totalUnidades === 1 ? 'unidade' : 'unidades'}`, tip: 'Locais com ao menos um alerta operacional. Ver detalhamento.', onClick: onVerUnidades, on: false },
    { key: 'total', icon: ListChecks, tone: 'default', label: 'Alertas ativos', value: stats.total, sec: ativo ? 'Limpar filtro' : 'Operacionais', tip: 'Total de alertas operacionais (exceto pendências). Clique para limpar o filtro.', onClick: () => onFiltrar(''), on: false },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => {
          const Icon = c.icon;
          const iconColor = c.tone === 'danger' ? 'text-destructive' : c.tone === 'warn' ? 'text-status-warning' : c.tone === 'info' ? 'text-[hsl(217_90%_45%)]' : 'text-primary';
          const valColor = c.tone === 'danger' ? 'text-destructive' : c.tone === 'warn' ? 'text-status-warning' : 'text-foreground';
          return (
            <Tooltip key={c.key}>
              <TooltipTrigger asChild>
                <button type="button" onClick={c.onClick} aria-pressed={c.on} aria-label={`${c.label}: ${formatNumberBR(c.value)}. ${c.tip}`}
                  className={cn('rounded-xl border bg-card p-3.5 text-left shadow-[var(--shadow-card)] transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    c.on ? 'border-primary ring-1 ring-primary' : c.tone === 'danger' ? 'border-destructive/30' : c.tone === 'warn' ? 'border-status-warning/30' : 'border-border/70')}>
                  <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60', iconColor)}><Icon className="h-4 w-4" /></span>
                  <div className="mt-2">
                    {loading ? <Skeleton className="h-7 w-12" /> : <p className={cn('text-2xl font-bold leading-none tabular-nums', valColor)}>{formatNumberBR(c.value)}</p>}
                    <p className="mt-1 text-xs font-medium text-foreground">{c.label}</p>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{c.sec}</p>
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent>{c.tip}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
