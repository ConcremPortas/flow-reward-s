import { Link } from 'react-router-dom';
import { Boxes, Layers, AlertTriangle, XCircle, Building2, ArrowLeftRight, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';

interface Props {
  stats: { itens: number; saldoTotal: number; emAlerta: number; semEstoque: number; unidadesComSaldo: number; movMes: number };
  loading: boolean;
  loadingMov: boolean;
  onFiltrarAlerta: () => void;
  onFiltrarSemEstoque: () => void;
  onVerUnidades: () => void;
}

type Tone = 'default' | 'warn' | 'danger';
interface Card {
  key: string; label: string; value: number; icon: LucideIcon; tone: Tone; tip: string;
  onClick?: () => void; to?: string; loading?: boolean;
}

export function FardamentosStats({ stats, loading, loadingMov, onFiltrarAlerta, onFiltrarSemEstoque, onVerUnidades }: Props) {
  const cards: Card[] = [
    { key: 'itens', label: 'Itens cadastrados', value: stats.itens, icon: Boxes, tone: 'default', tip: 'Total de variantes de fardamento cadastradas (ativas e inativas).' },
    { key: 'saldo', label: 'Saldo total', value: stats.saldoTotal, icon: Layers, tone: 'default', tip: 'Soma das peças em estoque em todos os locais.' },
    { key: 'alerta', label: 'Em alerta', value: stats.emAlerta, icon: AlertTriangle, tone: stats.emAlerta > 0 ? 'warn' : 'default', tip: 'Itens no mínimo ou com ruptura em algum local. Clique para filtrar.', onClick: onFiltrarAlerta },
    { key: 'sem', label: 'Sem estoque', value: stats.semEstoque, icon: XCircle, tone: stats.semEstoque > 0 ? 'danger' : 'default', tip: 'Itens com saldo total zerado. Clique para filtrar.', onClick: onFiltrarSemEstoque },
    { key: 'unidades', label: 'Locais com saldo', value: stats.unidadesComSaldo, icon: Building2, tone: 'default', tip: 'Locais de estoque com ao menos uma peça. Clique para ver a visão por local.', onClick: onVerUnidades },
    { key: 'mov', label: 'Movimentações no mês', value: stats.movMes, icon: ArrowLeftRight, tone: 'default', tip: 'Operações registradas no mês corrente. Abrir histórico.', to: '/controle-estoque/movimentacoes', loading: loadingMov },
  ];

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => {
          const inner = <StatContent card={c} loading={loading || (c.loading ?? false)} />;
          const base = 'group rounded-xl border bg-card p-3.5 text-left shadow-[var(--shadow-card)] transition-colors';
          const toneBorder = c.tone === 'danger' ? 'border-destructive/30' : c.tone === 'warn' ? 'border-status-warning/30' : 'border-border/70';
          if (c.to) {
            return (
              <Tooltip key={c.key}>
                <TooltipTrigger asChild>
                  <Link to={c.to} className={cn(base, toneBorder, 'hover:border-primary/40 hover:bg-muted/40')} aria-label={`${c.label}: ${formatNumberBR(c.value)}`}>{inner}</Link>
                </TooltipTrigger>
                <TooltipContent>{c.tip}</TooltipContent>
              </Tooltip>
            );
          }
          if (c.onClick) {
            return (
              <Tooltip key={c.key}>
                <TooltipTrigger asChild>
                  <button type="button" onClick={c.onClick} className={cn(base, toneBorder, 'hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')} aria-label={`${c.label}: ${formatNumberBR(c.value)}. ${c.tip}`}>{inner}</button>
                </TooltipTrigger>
                <TooltipContent>{c.tip}</TooltipContent>
              </Tooltip>
            );
          }
          return (
            <Tooltip key={c.key}>
              <TooltipTrigger asChild>
                <div className={cn(base, toneBorder)} tabIndex={0} aria-label={`${c.label}: ${formatNumberBR(c.value)}`}>{inner}</div>
              </TooltipTrigger>
              <TooltipContent>{c.tip}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

function StatContent({ card, loading }: { card: Card; loading: boolean }) {
  const Icon = card.icon;
  const color = card.tone === 'danger' ? 'text-destructive' : card.tone === 'warn' ? 'text-status-warning' : 'text-primary';
  return (
    <div className="flex items-start gap-3">
      <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60', color)}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        {loading ? <Skeleton className="h-6 w-12" /> : <p className={cn('text-xl font-bold leading-none tabular-nums', card.tone === 'danger' ? 'text-destructive' : card.tone === 'warn' ? 'text-status-warning' : 'text-foreground')}>{formatNumberBR(card.value)}</p>}
        <p className="mt-1 truncate text-xs font-medium text-muted-foreground">{card.label}</p>
      </div>
    </div>
  );
}
