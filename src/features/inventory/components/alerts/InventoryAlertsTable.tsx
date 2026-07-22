import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MoreHorizontal, Eye, History, PackagePlus, SlidersHorizontal, Settings, Building2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/app/StatusBadge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { formatNumberBR, formatCurrencyBRL } from '@/lib/formatters';
import { formatDateBR } from '@/lib/dateTime';
import { InventorySeverityBadge } from './InventorySeverityBadge';
import { SEV_RANK, SEV_LABEL, SEV_VARIANT, type Severidade } from './severity';
import { MOVEMENT_TYPE_LABEL, MOVEMENT_IS_ENTRADA } from '../../domain/domainConstants';
import type { AlertRow, Agrupamento } from '../../hooks/useInventoryAlerts';

interface Props {
  rows: AlertRow[]; agrupamento: Agrupamento;
  onOpen: (varianteId: string, aba?: string) => void;
  onFiltrarUnidade: (id: string) => void;
  onFiltrarCategoria: (cat: string) => void;
}

function diffTexto(r: AlertRow): string {
  if (r.severidade === 'SEM_MINIMO') return 'Mínimo não definido';
  if (r.quantidade <= 0) return 'Saldo zerado';
  if (r.quantidade < r.minimo) return `Faltam ${formatNumberBR(r.minimo - r.quantidade)}`;
  if (r.quantidade > r.minimo) return `${formatNumberBR(r.quantidade - r.minimo)} acima do mínimo`;
  return 'No limite';
}

export function InventoryAlertsTable({ rows, agrupamento, onOpen, onFiltrarUnidade, onFiltrarCategoria }: Props) {
  if (agrupamento === 'unidade') return <PorUnidade rows={rows} onFiltrar={onFiltrarUnidade} />;
  if (agrupamento === 'categoria') return <PorCategoria rows={rows} onFiltrar={onFiltrarCategoria} />;

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
              <th className="pb-2.5 pr-3 font-medium">Item</th>
              <th className="pb-2.5 pr-3 font-medium">Local</th>
              <th className="hidden pb-2.5 pr-3 font-medium xl:table-cell">Categoria</th>
              <th className="pb-2.5 pr-3 font-medium">Saldo / mín.</th>
              <th className="pb-2.5 pr-3 font-medium">Diferença</th>
              <th className="pb-2.5 pr-3 font-medium">Severidade</th>
              <th className="hidden pb-2.5 pr-3 font-medium lg:table-cell">Última mov.</th>
              <th className="pb-2.5 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>{rows.map((r) => <Row key={r.key} r={r} onOpen={onOpen} onFiltrarUnidade={onFiltrarUnidade} />)}</tbody>
        </table>
      </div>
      {/* Mobile */}
      <div className="space-y-2.5 md:hidden">{rows.map((r) => <Card key={r.key} r={r} onOpen={onOpen} onFiltrarUnidade={onFiltrarUnidade} />)}</div>
    </>
  );
}

function AcoesMenu({ r, onOpen, onFiltrarUnidade }: { r: AlertRow } & Pick<Props, 'onOpen' | 'onFiltrarUnidade'>) {
  const navigate = useNavigate();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Ações de ${r.f.variante.nome}`} onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={() => onOpen(r.f.variante.id)}><Eye className="mr-2 h-4 w-4" /> Ver item</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onOpen(r.f.variante.id, 'movimentacoes')}><History className="mr-2 h-4 w-4" /> Ver histórico</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/controle-estoque/entradas')}><PackagePlus className="mr-2 h-4 w-4" /> Registrar entrada</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/controle-estoque/ajuste')}><SlidersHorizontal className="mr-2 h-4 w-4" /> Ajustar saldo</DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/controle-estoque/cadastros')}><Settings className="mr-2 h-4 w-4" /> Configurar mínimo</DropdownMenuItem>
        <DropdownMenuItem onClick={() => onFiltrarUnidade(r.unidadeId)}><Building2 className="mr-2 h-4 w-4" /> Abrir unidade</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AcaoRecomendada({ r }: { r: AlertRow }) {
  const navigate = useNavigate();
  const cfg = r.severidade === 'SEM_MINIMO'
    ? { label: 'Configurar mínimo', to: '/controle-estoque/cadastros' }
    : { label: 'Registrar entrada', to: '/controle-estoque/entradas' };
  return <Button variant="outline" size="sm" className="h-7 whitespace-nowrap px-2 text-xs" onClick={(e) => { e.stopPropagation(); navigate(cfg.to); }}>{cfg.label}</Button>;
}

function UltimaCell({ r }: { r: AlertRow }) {
  if (!r.ultima) return <span className="text-xs text-muted-foreground">Sem movimentação</span>;
  const u = r.ultima;
  const entrada = MOVEMENT_IS_ENTRADA[u.tipo as keyof typeof MOVEMENT_IS_ENTRADA] ?? true;
  return (
    <div className="text-xs">
      <div className="flex items-center gap-1.5"><StatusBadge variant={entrada ? 'success' : 'warning'}>{MOVEMENT_TYPE_LABEL[u.tipo as keyof typeof MOVEMENT_TYPE_LABEL] ?? u.tipo}</StatusBadge><span className={cn('tabular-nums', entrada ? 'text-success' : 'text-status-warning')}>{u.direcao === 'IN' ? '+' : '−'}{formatNumberBR(u.quantidade)}</span></div>
      <div className="mt-0.5 text-muted-foreground">{formatDateBR(u.createdAt)}</div>
    </div>
  );
}

function SaldoCell({ r }: { r: AlertRow }) {
  const pct = r.minimo > 0 ? Math.min(100, Math.round((r.quantidade / r.minimo) * 100)) : null;
  const cor = r.severidade === 'SEM_ESTOQUE' || r.severidade === 'CRITICO' ? 'bg-destructive' : r.severidade === 'ABAIXO_MIN' ? 'bg-status-warning' : 'bg-[hsl(217_90%_55%)]';
  return (
    <div>
      <div className="tabular-nums"><span className="font-semibold text-foreground">{formatNumberBR(r.quantidade)}</span><span className="text-muted-foreground"> / {r.minimo > 0 ? formatNumberBR(r.minimo) : '—'}</span></div>
      <div className="mt-1 h-1.5 w-20 overflow-hidden rounded-full bg-muted"><div className={cn('h-full rounded-full', cor)} style={{ width: `${pct ?? 3}%` }} /></div>
      {pct != null && <div className="mt-0.5 text-[11px] text-muted-foreground">{pct}% do mínimo</div>}
    </div>
  );
}

function Row({ r, onOpen, onFiltrarUnidade }: { r: AlertRow } & Pick<Props, 'onOpen' | 'onFiltrarUnidade'>) {
  return (
    <tr className={cn('cursor-pointer border-b border-border/40 align-top transition-colors last:border-0 hover:bg-muted/40', !r.ativo && 'opacity-60')}
      onClick={() => onOpen(r.f.variante.id)} tabIndex={0} role="button" aria-label={`Alerta de ${r.f.variante.nome} em ${r.unidadeNome}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(r.f.variante.id); } }}>
      <td className="py-3 pr-3">
        <div className="font-medium text-foreground">{r.f.variante.nome}</div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="font-mono">{r.f.variante.codigo_interno}</span>{!r.ativo && <StatusBadge variant="neutral">Inativo</StatusBadge>}</div>
      </td>
      <td className="py-3 pr-3 text-muted-foreground">{r.unidadeNome}</td>
      <td className="hidden py-3 pr-3 text-muted-foreground xl:table-cell">{r.categoria}{r.f.modeloNome ? <span className="block text-xs">{r.f.modeloNome}</span> : null}</td>
      <td className="py-3 pr-3"><SaldoCell r={r} /></td>
      <td className={cn('py-3 pr-3 text-sm', r.quantidade < r.minimo ? 'text-destructive' : 'text-muted-foreground')}>{diffTexto(r)}</td>
      <td className="py-3 pr-3"><InventorySeverityBadge sev={r.severidade} /></td>
      <td className="hidden py-3 pr-3 lg:table-cell"><UltimaCell r={r} /></td>
      <td className="py-3">
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <AcaoRecomendada r={r} />
          <AcoesMenu r={r} onOpen={onOpen} onFiltrarUnidade={onFiltrarUnidade} />
        </div>
      </td>
    </tr>
  );
}

function Card({ r, onOpen, onFiltrarUnidade }: { r: AlertRow } & Pick<Props, 'onOpen' | 'onFiltrarUnidade'>) {
  return (
    <div className={cn('rounded-xl border border-border/70 bg-card p-3.5 shadow-[var(--shadow-card)]', !r.ativo && 'opacity-60')}>
      <div className="flex items-start justify-between gap-2">
        <InventorySeverityBadge sev={r.severidade} />
        <AcoesMenu r={r} onOpen={onOpen} onFiltrarUnidade={onFiltrarUnidade} />
      </div>
      <button type="button" className="mt-2 block w-full text-left" onClick={() => onOpen(r.f.variante.id)}>
        <div className="truncate font-medium text-foreground">{r.f.variante.nome}</div>
        <div className="truncate text-xs text-muted-foreground"><span className="font-mono">{r.f.variante.codigo_interno}</span> · {r.unidadeNome}</div>
      </button>
      <div className="mt-2.5 flex items-end justify-between gap-2">
        <div className="text-sm"><span className="font-semibold tabular-nums text-foreground">{formatNumberBR(r.quantidade)}</span><span className="text-muted-foreground"> / {r.minimo > 0 ? formatNumberBR(r.minimo) : '—'}</span><div className={cn('text-xs', r.quantidade < r.minimo ? 'text-destructive' : 'text-muted-foreground')}>{diffTexto(r)}</div></div>
        <AcaoRecomendada r={r} />
      </div>
    </div>
  );
}

// ── Agrupamentos ─────────────────────────────────────────────────────────────
function PorUnidade({ rows, onFiltrar }: { rows: AlertRow[]; onFiltrar: (id: string) => void }) {
  const grupos = useMemo(() => {
    const m = new Map<string, { unidadeId: string; nome: string; semEstoque: number; abaixo: number; proximo: number; saldo: number; valorRepor: number }>();
    for (const r of rows) {
      const e = m.get(r.unidadeId) ?? { unidadeId: r.unidadeId, nome: r.unidadeNome, semEstoque: 0, abaixo: 0, proximo: 0, saldo: 0, valorRepor: 0 };
      if (r.severidade === 'SEM_ESTOQUE') e.semEstoque++; else if (r.severidade === 'CRITICO' || r.severidade === 'ABAIXO_MIN') e.abaixo++; else if (r.severidade === 'PROXIMO') e.proximo++;
      e.saldo += r.quantidade; e.valorRepor += r.valorRepor; m.set(r.unidadeId, e);
    }
    return [...m.values()].sort((a, b) => (b.semEstoque - a.semEstoque) || (b.abaixo - a.abaixo));
  }, [rows]);
  return (
    <ul className="space-y-2">
      {grupos.map((g) => (
        <li key={g.unidadeId}>
          <button type="button" onClick={() => onFiltrar(g.unidadeId)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-border/60 p-3 text-left transition-colors hover:bg-muted/40">
            <div className="min-w-0"><div className="truncate font-medium text-foreground">{g.nome}</div><div className="text-xs text-muted-foreground">Saldo em alerta: {formatNumberBR(g.saldo)} · repor {formatCurrencyBRL(g.valorRepor)}</div></div>
            <div className="flex shrink-0 items-center gap-1.5">
              {g.semEstoque > 0 && <StatusBadge variant="danger">{g.semEstoque} sem estoque</StatusBadge>}
              {g.abaixo > 0 && <StatusBadge variant="warning">{g.abaixo} abaixo</StatusBadge>}
              {g.proximo > 0 && <StatusBadge variant="info">{g.proximo} próx.</StatusBadge>}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

function PorCategoria({ rows, onFiltrar }: { rows: AlertRow[]; onFiltrar: (cat: string) => void }) {
  const grupos = useMemo(() => {
    const m = new Map<string, { categoria: string; total: number; semEstoque: number; unidades: Set<string>; pior: Severidade }>();
    for (const r of rows) {
      const e = m.get(r.categoria) ?? { categoria: r.categoria, total: 0, semEstoque: 0, unidades: new Set<string>(), pior: 'NORMAL' as Severidade };
      e.total++; if (r.severidade === 'SEM_ESTOQUE') e.semEstoque++; e.unidades.add(r.unidadeId);
      if (SEV_RANK[r.severidade] < SEV_RANK[e.pior]) e.pior = r.severidade;
      m.set(r.categoria, e);
    }
    return [...m.values()].sort((a, b) => b.total - a.total);
  }, [rows]);
  return (
    <ul className="space-y-2">
      {grupos.map((g) => (
        <li key={g.categoria}>
          <button type="button" onClick={() => onFiltrar(g.categoria)} className="flex w-full items-center justify-between gap-3 rounded-lg border border-border/60 p-3 text-left transition-colors hover:bg-muted/40">
            <div className="min-w-0"><div className="truncate font-medium text-foreground">{g.categoria}</div><div className="text-xs text-muted-foreground">{g.total} {g.total === 1 ? 'alerta' : 'alertas'} · {g.unidades.size} {g.unidades.size === 1 ? 'unidade' : 'unidades'}</div></div>
            <div className="flex shrink-0 items-center gap-1.5">
              <StatusBadge variant={SEV_VARIANT[g.pior]}>{SEV_LABEL[g.pior]}</StatusBadge>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
