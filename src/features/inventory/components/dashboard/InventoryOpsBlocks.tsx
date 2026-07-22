import { useNavigate } from 'react-router-dom';
import { PackagePlus, ClipboardCheck, Repeat2, SlidersHorizontal, Search, Download, Wallet, ClipboardList, ChevronRight, type LucideIcon } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrencyBRL } from '@/lib/formatters';
import type { DashboardData } from './derive';

// ── Ações rápidas ───────────────────────────────────────────────────────────
export function InventoryQuickActions({ onExportar }: { onExportar: () => void }) {
  const navigate = useNavigate();
  const acoes: { icon: LucideIcon; titulo: string; desc: string; onClick: () => void }[] = [
    { icon: PackagePlus, titulo: 'Registrar entrada', desc: 'Dar entrada de itens no estoque', onClick: () => navigate('/controle-estoque/entradas') },
    { icon: ClipboardCheck, titulo: 'Nova entrega', desc: 'Entregar fardamento a colaborador', onClick: () => navigate('/controle-estoque/entregas') },
    { icon: Repeat2, titulo: 'Registrar devolução', desc: 'Receber itens de volta', onClick: () => navigate('/controle-estoque/devolucoes') },
    { icon: SlidersHorizontal, titulo: 'Ajustar saldo', desc: 'Correção por inventário', onClick: () => navigate('/controle-estoque/ajuste') },
    { icon: Search, titulo: 'Consultar itens', desc: 'Ver catálogo e saldos', onClick: () => navigate('/controle-estoque/fardamentos') },
    { icon: Download, titulo: 'Exportar relatório', desc: 'CSV dos itens no escopo', onClick: onExportar },
  ];
  return (
    <SectionCard title="Ações rápidas" description="Atalhos operacionais.">
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {acoes.map((a) => (
          <button key={a.titulo} type="button" onClick={a.onClick}
            className="flex items-center gap-2.5 rounded-lg border border-border/60 p-2.5 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-primary"><a.icon className="h-4 w-4" /></span>
            <span className="min-w-0"><span className="block truncate text-sm font-medium text-foreground">{a.titulo}</span><span className="block truncate text-[11px] text-muted-foreground">{a.desc}</span></span>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

// ── Visão financeira ─────────────────────────────────────────────────────────
export function InventoryFinancialSummary({ fin, loading }: { fin: DashboardData['financeiro']; loading: boolean }) {
  return (
    <SectionCard title="Valor estimado em estoque" description="Saldo × custo unitário no escopo atual.">
      {loading ? (
        <div className="space-y-3"><Skeleton className="h-8 w-40" /><Skeleton className="h-16 w-full" /></div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <Wallet className="mb-1 h-5 w-5 text-primary" />
            <span className="text-2xl font-bold tabular-nums text-foreground">{formatCurrencyBRL(fin.valor)}</span>
          </div>
          {fin.cobertura < 100 && (
            <p className="rounded-md bg-status-warning/10 px-2.5 py-1.5 text-xs text-status-warning">
              Valor parcial — {fin.cobertura}% dos itens possuem custo cadastrado.
            </p>
          )}
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <Campo rot="Custo médio/peça" val={formatCurrencyBRL(fin.custoMedio)} />
            <Campo rot="Cobertura de custo" val={`${fin.cobertura}%`} />
            <Campo rot="Local com maior valor" val={fin.unidadeMaior ?? '—'} />
            <Campo rot="Categoria com maior valor" val={fin.categoriaMaior ?? '—'} />
          </dl>
          {fin.breakdownUnidade.length > 0 && (
            <div className="border-t border-border/60 pt-2">
              <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">Por local</p>
              <ul className="space-y-1">
                {fin.breakdownUnidade.map((b) => (
                  <li key={b.nome} className="flex justify-between gap-2 text-xs"><span className="truncate text-muted-foreground">{b.nome}</span><span className="tabular-nums font-medium text-foreground">{formatCurrencyBRL(b.valor)}</span></li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}

// ── Pendências de cadastro (só renderiza se houver) ──────────────────────────
export function InventoryDataIssues({ pend }: { pend: DashboardData['pendencias'] }) {
  const navigate = useNavigate();
  const itens = [
    { rot: 'Variantes sem custo', n: pend.semCusto },
    { rot: 'Itens sem estoque mínimo', n: pend.semMinimo },
    { rot: 'Itens sem fornecedor', n: pend.semFornecedor },
    { rot: 'Itens sem categoria', n: pend.semCategoria },
  ].filter((i) => i.n > 0);
  if (itens.length === 0) return null;

  return (
    <SectionCard title="Pendências de cadastro" description="Dados incompletos que afetam relatórios.">
      <ul className="space-y-1.5">
        {itens.map((i) => (
          <li key={i.rot}>
            <button type="button" onClick={() => navigate('/controle-estoque/cadastros')}
              className="flex w-full items-center justify-between gap-2 rounded-lg border border-border/60 px-2.5 py-2 text-left text-sm transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className="flex items-center gap-2 text-foreground"><ClipboardList className="h-4 w-4 text-status-warning" /> {i.rot}</span>
              <span className="flex items-center gap-1 tabular-nums font-semibold text-status-warning">{i.n} <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" /></span>
            </button>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function Campo({ rot, val }: { rot: string; val: string }) {
  return <div><dt className="text-muted-foreground">{rot}</dt><dd className="font-medium text-foreground">{val}</dd></div>;
}
