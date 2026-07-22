import { Link } from 'react-router-dom';
import { Wallet, Layers, Boxes, AlertTriangle, XCircle, ClipboardCheck, TrendingUp, TrendingDown, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatNumberBR, formatCurrencyBRL } from '@/lib/formatters';
import type { DashboardData } from './derive';

interface Props {
  exec: DashboardData['exec'];
  cobertura: number;
  loading: boolean;
  loadingMov: boolean;
  onFiltrarAlerta: () => void;
  onFiltrarSemEstoque: () => void;
  onVerValor: () => void;
}

export function InventoryExecutiveStats({ exec, cobertura, loading, loadingMov, onFiltrarAlerta, onFiltrarSemEstoque, onVerValor }: Props) {
  const compEntregas = exec.entregasAnterior > 0 ? Math.round(((exec.entregas - exec.entregasAnterior) / exec.entregasAnterior) * 100) : null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Card icon={Wallet} tone="default" label="Valor total em estoque" tip="Soma de saldo × custo unitário no escopo atual. Clique para ver a composição."
          valor={loading ? null : formatCurrencyBRL(exec.valorTotal)} sec={cobertura < 100 ? `${cobertura}% dos itens com custo` : `Distribuído em ${formatNumberBR(exec.unidadesComSaldo)} ${exec.unidadesComSaldo === 1 ? 'local' : 'locais'}`} onClick={onVerValor} />
        <Card icon={Layers} tone="default" label="Peças disponíveis" tip="Total de peças em estoque no escopo atual."
          valor={loading ? null : formatNumberBR(exec.pecas)} sec={loadingMov ? undefined : `${formatNumberBR(exec.movimentadasPeriodo)} movimentadas no período`} />
        <Card icon={Boxes} tone="default" label="Itens no escopo" tip="Variantes de fardamento consideradas nos filtros atuais."
          valor={loading ? null : formatNumberBR(exec.itens)} sec="Ativos no escopo" />
        <Card icon={AlertTriangle} tone={exec.emAlerta > 0 ? 'warn' : 'default'} label="Itens em alerta" tip="No mínimo ou com ruptura em algum local. Clique para filtrar."
          valor={loading ? null : formatNumberBR(exec.emAlerta)} sec={exec.emAlerta > 0 ? 'Requer atenção' : 'Tudo sob controle'} onClick={onFiltrarAlerta} />
        <Card icon={XCircle} tone={exec.semEstoque > 0 ? 'danger' : 'default'} label="Sem estoque" tip="Itens com saldo zerado. Clique para filtrar."
          valor={loading ? null : formatNumberBR(exec.semEstoque)} sec={exec.semEstoque > 0 ? 'Reposição necessária' : 'Nenhum zerado'} onClick={onFiltrarSemEstoque} />
        <Card icon={ClipboardCheck} tone="default" label="Entregas no período" tip="Entregas registradas no período. Abrir histórico." to="/controle-estoque/movimentacoes"
          valor={loadingMov ? null : formatNumberBR(exec.entregas)} sec={loadingMov ? undefined : compEntregas === null ? 'sem base anterior' : undefined}
          comp={compEntregas} />
      </div>
    </TooltipProvider>
  );
}

interface CardProps {
  icon: LucideIcon; tone: 'default' | 'warn' | 'danger'; label: string; tip: string;
  valor: string | null; sec?: string; comp?: number | null; onClick?: () => void; to?: string;
}

function Card({ icon: Icon, tone, label, tip, valor, sec, comp, onClick, to }: CardProps) {
  const iconColor = tone === 'danger' ? 'text-destructive' : tone === 'warn' ? 'text-status-warning' : 'text-primary';
  const valColor = tone === 'danger' ? 'text-destructive' : tone === 'warn' ? 'text-status-warning' : 'text-foreground';
  const border = tone === 'danger' ? 'border-destructive/30' : tone === 'warn' ? 'border-status-warning/30' : 'border-border/70';
  const clicavel = !!(onClick || to);

  const body = (
    <>
      <div className="flex items-start justify-between">
        <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60', iconColor)}><Icon className="h-4 w-4" /></span>
        {comp != null && (
          <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium tabular-nums', comp >= 0 ? 'text-success' : 'text-destructive')}>
            {comp >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}{comp >= 0 ? '+' : ''}{comp}%
          </span>
        )}
      </div>
      <div className="mt-2">
        {valor === null ? <Skeleton className="h-7 w-20" /> : <p className={cn('text-2xl font-bold leading-none tabular-nums', valColor)}>{valor}</p>}
        <p className="mt-1 text-xs font-medium text-foreground">{label}</p>
        {sec && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{sec}</p>}
      </div>
    </>
  );

  const base = cn('rounded-xl border bg-card p-3.5 text-left shadow-[var(--shadow-card)]', border, clicavel && 'transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {to ? <Link to={to} className={base} aria-label={`${label}: ${valor ?? ''}`}>{body}</Link>
          : onClick ? <button type="button" onClick={onClick} className={base} aria-label={`${label}. ${tip}`}>{body}</button>
            : <div className={base} tabIndex={0} aria-label={`${label}: ${valor ?? ''}`}>{body}</div>}
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}
