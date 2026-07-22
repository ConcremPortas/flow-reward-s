import { ArrowLeftRight, ArrowDownToLine, ArrowUpFromLine, Layers, SlidersHorizontal, Undo2, ArrowRight, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SectionCard } from '@/components/app/SectionCard';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';

type Kind = 'total' | 'entradas' | 'saidas' | 'pecas' | 'ajustes' | 'estornos';
interface Stats { total: number; entradas: number; saidas: number; pecas: number; ajustes: number; estornos: number }

export function InventoryMovementsStats({ stats, loading, onSelect }: { stats: Stats; loading: boolean; onSelect: (k: Kind) => void }) {
  const cards: { key: Kind; label: string; value: number; icon: LucideIcon; tone: 'default' | 'in' | 'out' | 'purple' | 'danger'; tip: string; click: boolean }[] = [
    { key: 'total', label: 'Movimentações', value: stats.total, icon: ArrowLeftRight, tone: 'default', tip: 'Total no período/filtros. Clique para limpar direção e tipo.', click: true },
    { key: 'entradas', label: 'Entradas', value: stats.entradas, icon: ArrowDownToLine, tone: 'in', tip: 'Operações que somam saldo. Clique para filtrar.', click: true },
    { key: 'saidas', label: 'Saídas', value: stats.saidas, icon: ArrowUpFromLine, tone: 'out', tip: 'Operações que baixam saldo. Clique para filtrar.', click: true },
    { key: 'pecas', label: 'Peças movimentadas', value: stats.pecas, icon: Layers, tone: 'default', tip: 'Soma de peças em todas as operações filtradas.', click: false },
    { key: 'ajustes', label: 'Ajustes', value: stats.ajustes, icon: SlidersHorizontal, tone: 'purple', tip: 'Correções de inventário. Clique para filtrar.', click: true },
    { key: 'estornos', label: 'Estornos', value: stats.estornos, icon: Undo2, tone: 'danger', tip: 'Operações revertidas.', click: false },
  ];
  const cor = (t: string) => t === 'in' ? 'text-success' : t === 'out' ? 'text-status-warning' : t === 'purple' ? 'text-[hsl(280_60%_45%)]' : t === 'danger' ? 'text-destructive' : 'text-primary';

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => {
          const Icon = c.icon;
          const inner = (
            <>
              <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60', cor(c.tone))}><Icon className="h-4 w-4" /></span>
              <div className="mt-2">{loading ? <Skeleton className="h-6 w-12" /> : <p className={cn('text-xl font-bold leading-none tabular-nums', cor(c.tone))}>{formatNumberBR(c.value)}</p>}<p className="mt-1 text-xs font-medium text-foreground">{c.label}</p></div>
            </>
          );
          const base = 'rounded-xl border border-border/70 bg-card p-3.5 text-left shadow-[var(--shadow-card)]';
          return (
            <Tooltip key={c.key}>
              <TooltipTrigger asChild>
                {c.click ? <button type="button" onClick={() => onSelect(c.key)} className={cn(base, 'transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring')} aria-label={`${c.label}: ${formatNumberBR(c.value)}`}>{inner}</button>
                  : <div className={base} tabIndex={0} aria-label={`${c.label}: ${formatNumberBR(c.value)}`}>{inner}</div>}
              </TooltipTrigger>
              <TooltipContent>{c.tip}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}

export function FlowSummary({ pecasIn, pecasOut, liquido, operacoes, unidadeMais, itemMais, loading }: {
  pecasIn: number; pecasOut: number; liquido: number; operacoes: number; unidadeMais: string | null; itemMais: string | null; loading: boolean;
}) {
  return (
    <SectionCard title="Fluxo do período" description="Movimentação líquida (não confundir com saldo atual).">
      {loading ? <Skeleton className="h-16 w-full" /> : (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2"><span className="text-2xl font-bold tabular-nums text-success">+{formatNumberBR(pecasIn)}</span><span className="text-xs text-muted-foreground">entraram</span></div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2"><span className="text-2xl font-bold tabular-nums text-status-warning">−{formatNumberBR(pecasOut)}</span><span className="text-xs text-muted-foreground">saíram</span></div>
          <div className="flex items-center gap-2 border-l border-border/60 pl-6"><span className={cn('text-2xl font-bold tabular-nums', liquido >= 0 ? 'text-foreground' : 'text-status-warning')}>{liquido >= 0 ? '+' : ''}{formatNumberBR(liquido)}</span><span className="text-xs text-muted-foreground">fluxo líquido</span></div>
          <div className="ml-auto flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
            <span>{formatNumberBR(operacoes)} operações</span>
            {unidadeMais && <span>Local + movimentado: <strong className="text-foreground">{unidadeMais}</strong></span>}
            {itemMais && <span>Item + movimentado: <strong className="text-foreground">{itemMais}</strong></span>}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
