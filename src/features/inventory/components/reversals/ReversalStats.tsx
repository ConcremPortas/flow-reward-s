import { XCircle, Undo2, Ban, RotateCcw, PackageCheck, Clock, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';

interface Stats { entElegiveis: number; devElegiveis: number; bloqueadas: number; estornosPeriodo: number; saldoRevertido: number; ultima: string | null }

export function ReversalStats({ stats, loading, onSoElegiveis }: { stats: Stats; loading: boolean; onSoElegiveis: (v: boolean) => void }) {
  const cards: { key: string; label: string; value: string; icon: LucideIcon; tone: 'default' | 'warn' | 'danger'; tip: string; onClick?: () => void }[] = [
    { key: 'ent', label: 'Entregas p/ cancelar', value: formatNumberBR(stats.entElegiveis), icon: XCircle, tone: 'default', tip: 'Entregas elegíveis para cancelamento. Clique para filtrar só elegíveis.', onClick: () => onSoElegiveis(true) },
    { key: 'dev', label: 'Devoluções p/ estornar', value: formatNumberBR(stats.devElegiveis), icon: Undo2, tone: 'default', tip: 'Devoluções ativas elegíveis para estorno. Clique para filtrar só elegíveis.', onClick: () => onSoElegiveis(true) },
    { key: 'blo', label: 'Bloqueadas', value: formatNumberBR(stats.bloqueadas), icon: Ban, tone: stats.bloqueadas > 0 ? 'warn' : 'default', tip: 'Operações com dependências ou já revertidas. Clique para ver todas.', onClick: () => onSoElegiveis(false) },
    { key: 'est', label: 'Estornos no período', value: formatNumberBR(stats.estornosPeriodo), icon: RotateCcw, tone: 'default', tip: 'Reversões já registradas na janela carregada.' },
    { key: 'sal', label: 'Saldo revertido', value: formatNumberBR(stats.saldoRevertido), icon: PackageCheck, tone: 'default', tip: 'Peças devolvidas ao estoque por cancelamentos/estornos.' },
    { key: 'ult', label: 'Última reversão', value: stats.ultima ? formatDateTimeBR(stats.ultima) : '—', icon: Clock, tone: 'default', tip: 'Data/hora da reversão mais recente.' },
  ];
  const cor = (t: string) => t === 'warn' ? 'text-status-warning' : t === 'danger' ? 'text-destructive' : 'text-primary';

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => {
          const Icon = c.icon;
          const inner = (<><span className={cn('flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60', cor(c.tone))}><Icon className="h-4 w-4" /></span>
            <div className="mt-2">{loading ? <Skeleton className="h-6 w-14" /> : <p className={cn('text-lg font-bold leading-none tabular-nums', c.tone === 'warn' ? 'text-status-warning' : 'text-foreground')}>{c.value}</p>}<p className="mt-1 text-xs font-medium text-foreground">{c.label}</p></div></>);
          const base = cn('rounded-xl border border-border/70 bg-card p-3.5 text-left shadow-[var(--shadow-card)]', c.onClick && 'transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring');
          return (
            <Tooltip key={c.key}>
              <TooltipTrigger asChild>{c.onClick ? <button type="button" onClick={c.onClick} className={base} aria-label={`${c.label}: ${c.value}`}>{inner}</button> : <div className={base} tabIndex={0} aria-label={`${c.label}: ${c.value}`}>{inner}</div>}</TooltipTrigger>
              <TooltipContent>{c.tip}</TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
