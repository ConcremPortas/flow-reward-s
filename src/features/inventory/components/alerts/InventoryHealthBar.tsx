import { SectionCard } from '@/components/app/SectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';
import type { Severidade } from './severity';

interface Saude { NORMAL: number; PROXIMO: number; ABAIXO_MIN: number; CRITICO: number; SEM_ESTOQUE: number; total: number; semMinimo: number; unidadeMaisAlertas: string | null; categoriaMaisAfetada: string | null }

const SEGS: { key: Severidade; label: string; cor: string }[] = [
  { key: 'NORMAL', label: 'Normais', cor: 'bg-success' },
  { key: 'PROXIMO', label: 'Próximos', cor: 'bg-[hsl(217_90%_55%)]' },
  { key: 'ABAIXO_MIN', label: 'Abaixo', cor: 'bg-status-warning' },
  { key: 'CRITICO', label: 'Críticos', cor: 'bg-destructive/60' },
  { key: 'SEM_ESTOQUE', label: 'Sem estoque', cor: 'bg-destructive' },
];

export function InventoryHealthBar({ saude, loading, onFiltrar }: { saude: Saude; loading: boolean; onFiltrar: (s: Severidade) => void }) {
  const total = saude.total || 1;
  const val = (k: Severidade) => (saude as unknown as Record<string, number>)[k] ?? 0;

  return (
    <SectionCard title="Saúde dos níveis mínimos" description="Distribuição das combinações item × unidade analisadas.">
      {loading ? (
        <div className="space-y-3"><Skeleton className="h-3 w-full" /><Skeleton className="h-14 w-full" /></div>
      ) : saude.total === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma combinação item × unidade para avaliar.</p>
      ) : (
        <div className="space-y-4">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={`Níveis: ${SEGS.map((s) => `${val(s.key)} ${s.label}`).join(', ')}`}>
            {SEGS.filter((s) => val(s.key) > 0).map((s) => <div key={s.key} className={cn('h-full', s.cor)} style={{ width: `${(val(s.key) / total) * 100}%` }} title={`${s.label}: ${val(s.key)}`} />)}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {SEGS.map((s) => (
              <button key={s.key} type="button" onClick={() => onFiltrar(s.key)}
                className="flex items-center gap-2 rounded-lg border border-border/60 px-2.5 py-2 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Filtrar ${s.label}: ${val(s.key)} (${Math.round((val(s.key) / total) * 100)}%)`}>
                <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', s.cor)} />
                <span className="min-w-0"><span className="block text-sm font-semibold tabular-nums text-foreground">{formatNumberBR(val(s.key))}</span><span className="block truncate text-[11px] text-muted-foreground">{s.label} · {Math.round((val(s.key) / total) * 100)}%</span></span>
              </button>
            ))}
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-border/60 pt-3 text-xs sm:grid-cols-4">
            <Info rot="Combinações" val={formatNumberBR(saude.total)} />
            <Info rot="Sem mínimo" val={formatNumberBR(saude.semMinimo)} tone={saude.semMinimo > 0 ? 'warn' : undefined} />
            <Info rot="Local + alertas" val={saude.unidadeMaisAlertas ?? '—'} />
            <Info rot="Categoria + afetada" val={saude.categoriaMaisAfetada ?? '—'} />
          </dl>
        </div>
      )}
    </SectionCard>
  );
}

function Info({ rot, val, tone }: { rot: string; val: string; tone?: 'warn' }) {
  return <div><dt className="text-muted-foreground">{rot}</dt><dd className={cn('font-medium', tone === 'warn' ? 'text-status-warning' : 'text-foreground')}>{val}</dd></div>;
}
