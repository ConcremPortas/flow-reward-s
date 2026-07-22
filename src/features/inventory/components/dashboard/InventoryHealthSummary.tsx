import { SectionCard } from '@/components/app/SectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';
import type { Situacao } from '../fardamentos/situacao';
import type { DashboardData } from './derive';

interface Seg { key: Situacao; label: string; cor: string; dot: string; count: number }

interface Props {
  saude: DashboardData['saude'];
  loading: boolean;
  onFiltrar: (s: Situacao) => void;
}

export function InventoryHealthSummary({ saude, loading, onFiltrar }: Props) {
  const total = saude.total || 1;
  const segs: Seg[] = [
    { key: 'NORMAL', label: 'Normais', cor: 'bg-success', dot: 'bg-success', count: saude.normal },
    { key: 'ATENCAO', label: 'Atenção', cor: 'bg-status-warning', dot: 'bg-status-warning', count: saude.atencao },
    { key: 'CRITICO', label: 'Críticos', cor: 'bg-destructive/60', dot: 'bg-destructive/60', count: saude.critico },
    { key: 'SEM_ESTOQUE', label: 'Sem estoque', cor: 'bg-destructive', dot: 'bg-destructive', count: saude.semEstoque },
  ];

  return (
    <SectionCard title="Saúde do estoque" description="Leitura rápida da situação dos itens.">
      {loading ? (
        <div className="space-y-3"><Skeleton className="h-4 w-full" /><Skeleton className="h-16 w-full" /></div>
      ) : saude.total === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nenhum item para avaliar no escopo atual.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={`Saúde: ${segs.map((s) => `${s.count} ${s.label}`).join(', ')}`}>
            {segs.filter((s) => s.count > 0).map((s) => (
              <div key={s.key} className={cn('h-full', s.cor)} style={{ width: `${(s.count / total) * 100}%` }} title={`${s.label}: ${s.count}`} />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {segs.map((s) => (
              <button key={s.key} type="button" onClick={() => onFiltrar(s.key)}
                className="flex items-center gap-2 rounded-lg border border-border/60 px-2.5 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Filtrar ${s.label}: ${s.count} itens (${Math.round((s.count / total) * 100)}%)`}>
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', s.dot)} />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold tabular-nums text-foreground">{formatNumberBR(s.count)} <span className="text-xs font-normal text-muted-foreground">· {Math.round((s.count / total) * 100)}%</span></span>
                  <span className="block truncate text-xs text-muted-foreground">{s.label}</span>
                </span>
              </button>
            ))}
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border/60 pt-3 text-xs sm:grid-cols-4">
            <Info rot="Itens analisados" val={formatNumberBR(saude.total)} />
            <Info rot="Com mínimo" val={formatNumberBR(saude.comMinimo)} />
            <Info rot="Sem mínimo" val={formatNumberBR(saude.semMinimo)} tone={saude.semMinimo > 0 ? 'warn' : undefined} />
            <Info rot="Local + alertas" val={saude.unidadeMaisAlertas ?? '—'} />
          </dl>
        </div>
      )}
    </SectionCard>
  );
}

function Info({ rot, val, tone }: { rot: string; val: string; tone?: 'warn' }) {
  return (
    <div>
      <dt className="text-muted-foreground">{rot}</dt>
      <dd className={cn('font-medium', tone === 'warn' ? 'text-status-warning' : 'text-foreground')}>{val}</dd>
    </div>
  );
}
