import { useNavigate, Link } from 'react-router-dom';
import { ChevronRight, Lightbulb, ArrowLeftRight } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge, type StatusVariant } from '@/components/app/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatNumberBR, formatCurrencyBRL } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import { MOVEMENT_TYPE_LABEL, MOVEMENT_IS_ENTRADA } from '../../domain/domainConstants';
import type { MovDetalhada } from '../../services/inventoryApi';

type UnidadeCritica = { unidadeId: string; nome: string; semEstoque: number; abaixo: number; proximo: number; valorRepor: number; alertas: number; pct: number };
type CategoriaAfetada = { categoria: string; total: number; semEstoque: number; unidades: number; pct: number };

export function CriticalUnitsPanel({ dados, loading, onFiltrar }: { dados: UnidadeCritica[]; loading: boolean; onFiltrar: (id: string) => void }) {
  return (
    <SectionCard title="Unidades mais críticas" description="Locais com maior risco de ruptura.">
      {loading ? <Sk /> : dados.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma unidade com alertas.</p>
      ) : (
        <ul className="space-y-2">
          {dados.map((u) => (
            <li key={u.unidadeId}>
              <button type="button" onClick={() => onFiltrar(u.unidadeId)} className="w-full rounded-lg border border-border/60 p-2.5 text-left transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Filtrar ${u.nome}`}>
                <div className="flex items-center justify-between gap-2"><span className="truncate text-sm font-medium text-foreground">{u.nome}</span><span className="shrink-0 text-xs text-muted-foreground">{u.pct}% afetado</span></div>
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {u.semEstoque > 0 && <StatusBadge variant="danger">{u.semEstoque} sem estoque</StatusBadge>}
                  {u.abaixo > 0 && <StatusBadge variant="warning">{u.abaixo} abaixo</StatusBadge>}
                  {u.proximo > 0 && <StatusBadge variant="info">{u.proximo} próx.</StatusBadge>}
                </div>
                {u.valorRepor > 0 && <div className="mt-1 text-xs text-muted-foreground">Repor ~ {formatCurrencyBRL(u.valorRepor)}</div>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function AffectedCategoriesPanel({ dados, loading, onFiltrar }: { dados: CategoriaAfetada[]; loading: boolean; onFiltrar: (cat: string) => void }) {
  return (
    <SectionCard title="Categorias mais afetadas" description="Onde os alertas se concentram.">
      {loading ? <Sk /> : dados.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma categoria afetada.</p>
      ) : (
        <ul className="space-y-3">
          {dados.map((c) => (
            <li key={c.categoria}>
              <button type="button" onClick={() => onFiltrar(c.categoria)} className="w-full rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`Filtrar ${c.categoria}`}>
                <div className="flex items-baseline justify-between gap-2 text-sm"><span className="truncate font-medium text-foreground">{c.categoria}</span><span className="shrink-0 tabular-nums text-muted-foreground">{c.total} · {c.pct}%</span></div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-status-warning" style={{ width: `${Math.max(c.pct, 2)}%` }} /></div>
                <div className="mt-1 text-xs text-muted-foreground">{c.semEstoque > 0 ? `${c.semEstoque} sem estoque · ` : ''}{c.unidades} {c.unidades === 1 ? 'unidade' : 'unidades'}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function RecommendationsPanel({ dados }: { dados: { id: string; texto: string; alvo: string }[] }) {
  const navigate = useNavigate();
  if (dados.length === 0) return null;
  return (
    <SectionCard title="Próximas ações" description="Sugestões baseadas nos alertas atuais.">
      <ul className="space-y-1.5">
        {dados.map((r) => (
          <li key={r.id}>
            <button type="button" onClick={() => navigate(r.alvo)} className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="flex min-w-0 items-center gap-2 text-foreground"><Lightbulb className="h-4 w-4 shrink-0 text-primary" /> <span className="truncate">{r.texto}</span></span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

export function RelatedMovementsPanel({ movs, unidadeNome, loading }: { movs: MovDetalhada[]; unidadeNome: Map<string, string>; loading: boolean }) {
  return (
    <SectionCard title="Movimentações relacionadas" description="Operações recentes de itens em alerta."
      actions={<Link to="/controle-estoque/movimentacoes" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Ver todas <ChevronRight className="h-3.5 w-3.5" /></Link>}>
      {loading ? <Sk /> : movs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center"><ArrowLeftRight className="h-6 w-6 text-muted-foreground" /><p className="text-sm text-muted-foreground">Sem movimentações recentes de itens em alerta.</p></div>
      ) : (
        <ul className="divide-y divide-border/40">
          {movs.map((m) => {
            const conhecido = m.tipo in MOVEMENT_TYPE_LABEL;
            const entrada = MOVEMENT_IS_ENTRADA[m.tipo as keyof typeof MOVEMENT_IS_ENTRADA] ?? true;
            const variant: StatusVariant = !conhecido ? 'neutral' : entrada ? 'success' : 'warning';
            const qtd = m.itens.reduce((a, it) => a + it.quantidade, 0);
            return (
              <li key={m.id} className="flex items-center justify-between gap-2 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <StatusBadge variant={variant}>{conhecido ? MOVEMENT_TYPE_LABEL[m.tipo as keyof typeof MOVEMENT_TYPE_LABEL] : m.tipo}</StatusBadge>
                  <div className="min-w-0"><div className="truncate font-mono text-xs text-foreground">{m.numero}</div><div className="truncate text-[11px] text-muted-foreground">{unidadeNome.get(m.unidadeId) ?? '—'}</div></div>
                </div>
                <div className="shrink-0 text-right"><div className={cn('text-sm font-semibold tabular-nums', entrada ? 'text-success' : 'text-status-warning')}>{entrada ? '+' : '−'}{formatNumberBR(qtd)}</div><div className="text-[11px] text-muted-foreground">{formatDateTimeBR(m.createdAt)}</div></div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

function Sk() { return <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div>; }
