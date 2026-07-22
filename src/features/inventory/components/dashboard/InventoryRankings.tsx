import { useMemo, useState } from 'react';
import { SectionCard } from '@/components/app/SectionCard';
import { EmptyState } from '@/components/app/EmptyState';
import { StatusBadge } from '@/components/app/StatusBadge';
import { cn } from '@/lib/utils';
import { formatNumberBR, formatCurrencyBRL } from '@/lib/formatters';
import type { DashboardData } from './derive';

function Barra({ pct, tone = 'primary' }: { pct: number; tone?: 'primary' | 'warn' }) {
  return <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted"><div className={cn('h-full rounded-full', tone === 'warn' ? 'bg-status-warning' : 'bg-primary')} style={{ width: `${Math.max(pct, 2)}%` }} /></div>;
}

export function InventoryByUnit({ dados, loading, onFiltrar }: { dados: DashboardData['porUnidade']; loading: boolean; onFiltrar: (id: string) => void }) {
  return (
    <SectionCard title="Saldo por local" description="Distribuição de peças e valor por local de estoque.">
      {loading ? <ListaSkeleton /> : dados.length === 0 ? (
        <EmptyState title="Nenhum local com saldo" description="Registre entradas para abastecer os locais." />
      ) : (
        <ul className="space-y-3">
          {dados.map((u) => (
            <li key={u.unidadeId}>
              <button type="button" onClick={() => onFiltrar(u.unidadeId)} className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md" aria-label={`Filtrar por ${u.nome}`}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-foreground">{u.nome}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{formatNumberBR(u.pecas)} pç · {u.pct}%</span>
                </div>
                <Barra pct={u.pct} />
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCurrencyBRL(u.valor)}</span>
                  {u.alertas > 0 && <StatusBadge variant="warning">{u.alertas} em alerta</StatusBadge>}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

export function InventoryByCategory({ dados, loading, onFiltrar }: { dados: DashboardData['porCategoria']; loading: boolean; onFiltrar: (cat: string) => void }) {
  return (
    <SectionCard title="Distribuição por categoria" description="Peças, valor e variantes por categoria.">
      {loading ? <ListaSkeleton /> : dados.length === 0 ? (
        <EmptyState title="Nenhuma categoria com saldo" description="Cadastre e abasteça itens para ver a distribuição." />
      ) : (
        <ul className="space-y-3">
          {dados.map((c) => (
            <li key={c.categoria}>
              <button type="button" onClick={() => onFiltrar(c.categoria)} className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md" aria-label={`Filtrar por ${c.categoria}`}>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate font-medium text-foreground">{c.categoria}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">{formatNumberBR(c.qtd)} pç · {c.pct}%</span>
                </div>
                <Barra pct={c.pct} />
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCurrencyBRL(c.valor)}</span>
                  <span>{formatNumberBR(c.variantes)} {c.variantes === 1 ? 'variante' : 'variantes'}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

type Modo = 'movimentados' | 'entregues' | 'menor_saldo' | 'maior_valor';
const MODOS: { key: Modo; label: string }[] = [
  { key: 'movimentados', label: 'Mais movimentados' }, { key: 'entregues', label: 'Mais entregues' },
  { key: 'menor_saldo', label: 'Menor saldo' }, { key: 'maior_valor', label: 'Maior valor' },
];

export function InventoryItemRanking({ dados, loading, onOpenItem }: { dados: DashboardData['ranking']; loading: boolean; onOpenItem: (varianteId: string) => void }) {
  const [modo, setModo] = useState<Modo>('movimentados');

  const rows = useMemo(() => {
    const arr = [...dados];
    if (modo === 'movimentados') arr.sort((a, b) => b.total - a.total);
    else if (modo === 'entregues') arr.sort((a, b) => b.entregas - a.entregas);
    else if (modo === 'menor_saldo') arr.sort((a, b) => a.saldo - b.saldo);
    else arr.sort((a, b) => b.valor - a.valor);
    return arr.slice(0, 6);
  }, [dados, modo]);

  const semAmostra = (modo === 'movimentados' || modo === 'entregues') && dados.every((d) => d.total === 0);

  return (
    <SectionCard title="Ranking de itens" description="Itens em destaque no período/escopo."
      actions={
        <div className="flex flex-wrap gap-1">
          {MODOS.map((m) => (
            <button key={m.key} type="button" onClick={() => setModo(m.key)} aria-pressed={modo === m.key}
              className={cn('rounded-md px-2 py-1 text-xs font-medium transition-colors', modo === m.key ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground')}>{m.label}</button>
          ))}
        </div>
      }>
      {loading ? <ListaSkeleton /> : rows.length === 0 || semAmostra ? (
        <EmptyState title="Amostra insuficiente" description="Não há movimentação suficiente no período para este ranking." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Item</th>
                <th className="pb-2 pr-3 text-right font-medium">Ent.</th>
                <th className="pb-2 pr-3 text-right font-medium">Entr.</th>
                <th className="pb-2 pr-3 text-right font-medium">Dev.</th>
                <th className="pb-2 pr-3 text-right font-medium">Saldo</th>
                <th className="pb-2 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.varianteId} className="cursor-pointer border-b border-border/40 last:border-0 hover:bg-muted/40" onClick={() => onOpenItem(r.varianteId)} tabIndex={0} role="button"
                  onKeyDown={(e) => { if (e.key === 'Enter') onOpenItem(r.varianteId); }} aria-label={`Detalhes de ${r.nome}`}>
                  <td className="py-2 pr-3"><div className="font-medium text-foreground">{r.nome}</div><div className="font-mono text-xs text-muted-foreground">{r.codigo} · {r.categoria}</div></td>
                  <td className="py-2 pr-3 text-right tabular-nums text-success">{r.entradas ? `+${formatNumberBR(r.entradas)}` : '—'}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-status-warning">{r.entregas ? `−${formatNumberBR(r.entregas)}` : '—'}</td>
                  <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">{r.devolucoes ? formatNumberBR(r.devolucoes) : '—'}</td>
                  <td className="py-2 pr-3 text-right tabular-nums font-medium">{formatNumberBR(r.saldo)}</td>
                  <td className="py-2 text-right tabular-nums text-muted-foreground">{formatCurrencyBRL(r.valor)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function ListaSkeleton() {
  return <div className="space-y-3">{[0, 1, 2, 3].map((i) => <div key={i} className="space-y-1"><div className="h-4 w-full animate-pulse rounded bg-muted" /><div className="h-1.5 w-full rounded bg-muted" /></div>)}</div>;
}
