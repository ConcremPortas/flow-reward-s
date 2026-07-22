import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight, CheckCircle2 } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge, type StatusVariant } from '@/components/app/StatusBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumberBR } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import { situacaoDaLinha, SITUACAO_LABEL, SITUACAO_VARIANT } from './situacao';
import { MOVEMENT_TYPE_LABEL, MOVEMENT_IS_ENTRADA } from '../../domain/domainConstants';
import type { FardamentoRow } from '../../types/db.types';
import type { MovDetalhada } from '../../services/inventoryApi';
import type { UnidadeResumo } from '../../hooks/useInventoryScreen';

interface Props {
  fardamentos: FardamentoRow[];
  movimentacoes: MovDetalhada[];
  porUnidade: UnidadeResumo[];
  loading: boolean;
  loadingMov: boolean;
  onOpen: (f: FardamentoRow) => void;
}

export function InventorySidePanel({ fardamentos, movimentacoes, porUnidade, loading, loadingMov, onOpen }: Props) {
  const atencoes = fardamentos
    .map((f) => ({ f, sit: situacaoDaLinha(f) }))
    .filter((x) => x.sit === 'ATENCAO' || x.sit === 'CRITICO' || x.sit === 'SEM_ESTOQUE')
    .sort((a, b) => (rank(a.sit) - rank(b.sit)))
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <SectionCard title="Atenções" description="Itens que exigem ação.">
        {loading ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : atencoes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <CheckCircle2 className="h-7 w-7 text-success" />
            <p className="text-sm text-muted-foreground">Estoque saudável. Nenhuma atenção.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/40">
            {atencoes.map(({ f, sit }) => (
              <li key={f.variante.id}>
                <button type="button" onClick={() => onOpen(f)} className="flex w-full items-center justify-between gap-2 py-2.5 text-left hover:opacity-80">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{f.variante.nome}</div>
                    <div className="truncate text-xs text-muted-foreground">Saldo {formatNumberBR(f.saldoTotal)} · {f.variante.codigo_interno}</div>
                  </div>
                  <StatusBadge variant={SITUACAO_VARIANT[sit] as StatusVariant}>{SITUACAO_LABEL[sit]}</StatusBadge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard
        title="Atividade recente" description="Últimas operações."
        actions={<Link to="/controle-estoque/movimentacoes" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">Ver todas <ChevronRight className="h-3.5 w-3.5" /></Link>}
      >
        {loadingMov ? (
          <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-9 w-full" />)}</div>
        ) : movimentacoes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma movimentação ainda.</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {movimentacoes.slice(0, 6).map((m) => {
              const conhecido = m.tipo in MOVEMENT_TYPE_LABEL;
              const variant: StatusVariant = !conhecido ? 'neutral' : MOVEMENT_IS_ENTRADA[m.tipo as keyof typeof MOVEMENT_IS_ENTRADA] ? 'success' : 'warning';
              return (
                <li key={m.id} className="flex items-center justify-between gap-2 py-2.5">
                  <div className="flex min-w-0 items-center gap-2">
                    <StatusBadge variant={variant}>{conhecido ? MOVEMENT_TYPE_LABEL[m.tipo as keyof typeof MOVEMENT_TYPE_LABEL] : m.tipo}</StatusBadge>
                    <span className="truncate font-mono text-xs text-foreground">{m.numero}</span>
                  </div>
                  <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{formatDateTimeBR(m.createdAt)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Visão por local" description="Saldo e alertas por local de estoque.">
        {loading ? (
          <div className="space-y-2">{[0, 1].map((i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : porUnidade.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum local com saldo.</p>
        ) : (
          <ul className="divide-y divide-border/40">
            {porUnidade.map((u) => (
              <li key={u.unidadeId} className="flex items-center justify-between gap-2 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">{u.nome}</div>
                  <div className="text-xs text-muted-foreground">{formatNumberBR(u.itens)} {u.itens === 1 ? 'item' : 'itens'} · {formatNumberBR(u.saldo)} em saldo</div>
                </div>
                {u.emAlerta > 0
                  ? <StatusBadge variant="warning"><AlertTriangle className="mr-1 h-3 w-3" />{u.emAlerta}</StatusBadge>
                  : <StatusBadge variant="success">OK</StatusBadge>}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>
    </div>
  );
}

function rank(s: string): number { return s === 'SEM_ESTOQUE' ? 0 : s === 'CRITICO' ? 1 : 2; }
