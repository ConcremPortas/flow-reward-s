import { useNavigate } from 'react-router-dom';
import { PackagePlus } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/app/StatusBadge';
import { EmptyState } from '@/components/app/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatNumberBR, formatCurrencyBRL } from '@/lib/formatters';
import { formatDateBR, formatDateTimeBR } from '@/lib/dateTime';
import { useFardamentoDetalhe } from '../../hooks/useFardamentoDetalhe';
import { situacaoDaLinha } from './situacao';
import { FardamentoStatusBadge } from './FardamentoStatusBadge';
import { STOCK_STATUS_LABEL } from '../../domain/stockStatus';
import {
  MOVEMENT_TYPE_LABEL, MOVEMENT_IS_ENTRADA, DELIVERY_TYPE_LABEL, RETURN_CONDITION_LABEL, RETURN_DESTINATION_LABEL,
} from '../../domain/domainConstants';
import type { StatusVariant } from '@/components/app/StatusBadge';
import type { StockStatus, DeliveryType, ReturnCondition, ReturnDestination } from '../../types/inventory.types';
import type { FardamentoRow } from '../../types/db.types';

const STATUS_VARIANT: Record<StockStatus, StatusVariant> = { SEM_ESTOQUE: 'danger', ALERTA: 'warning', NORMAL: 'success' };

interface Props {
  fardamento: FardamentoRow | null;
  abaInicial?: string;
  onOpenChange: (o: boolean) => void;
}

export function FardamentoDetailsDrawer({ fardamento, abaInicial = 'resumo', onOpenChange }: Props) {
  const navigate = useNavigate();
  const det = useFardamentoDetalhe(fardamento?.variante.id ?? null);
  const f = fardamento;

  return (
    <Sheet open={f !== null} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-[94vw] flex-col gap-0 p-0 sm:max-w-xl">
        {f && (
          <>
            <SheetHeader className="border-b border-border/60 p-5 pb-4 text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SheetTitle className="truncate text-lg">{f.variante.nome}</SheetTitle>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">{f.variante.codigo_interno}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[f.categoriaNome, f.modeloNome, f.tamanhoRotulo].filter(Boolean).join(' · ') || '—'}
                  </p>
                </div>
                <FardamentoStatusBadge situacao={situacaoDaLinha(f)} />
              </div>
              <div className="mt-3">
                <Button size="sm" className="gap-2" onClick={() => navigate('/controle-estoque/entradas')}>
                  <PackagePlus className="h-4 w-4" /> Registrar entrada
                </Button>
              </div>
            </SheetHeader>

            <Tabs defaultValue={abaInicial} className="flex min-h-0 flex-1 flex-col">
              <TabsList className="mx-5 mt-3 flex w-auto flex-wrap justify-start gap-1 bg-transparent p-0">
                {[['resumo', 'Resumo'], ['unidades', 'Por local'], ['movimentacoes', 'Movimentações'], ['entregas', 'Entregas'], ['devolucoes', 'Devoluções']].map(([v, l]) => (
                  <TabsTrigger key={v} value={v} className="rounded-md px-2.5 py-1 text-xs data-[state=active]:bg-muted">{l}</TabsTrigger>
                ))}
              </TabsList>

              <ScrollArea className="min-h-0 flex-1 px-5 py-4">
                <TabsContent value="resumo" className="mt-0"><ResumoTab f={f} det={det} /></TabsContent>
                <TabsContent value="unidades" className="mt-0"><UnidadesTab f={f} /></TabsContent>
                <TabsContent value="movimentacoes" className="mt-0"><MovsTab det={det} /></TabsContent>
                <TabsContent value="entregas" className="mt-0"><EntregasTab det={det} /></TabsContent>
                <TabsContent value="devolucoes" className="mt-0"><DevolucoesTab det={det} /></TabsContent>
              </ScrollArea>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function ResumoTab({ f, det }: { f: FardamentoRow; det: ReturnType<typeof useFardamentoDetalhe> }) {
  const ordenadas = [...f.saldos].sort((a, b) => b.quantidade - a.quantidade);
  const maior = ordenadas[0];
  const menor = ordenadas[ordenadas.length - 1];
  const fornecedor = f.variante.fornecedor?.nome_fantasia || f.variante.fornecedor?.razao_social || '—';
  const ultEntrada = det.movs.find((m) => m.direcao === 'IN');
  const ultSaida = det.movs.find((m) => m.direcao === 'OUT');
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
      <Campo rot="Saldo total" val={formatNumberBR(f.saldoTotal)} destaque />
      <Campo rot="Estoque mínimo (padrão)" val={f.variante.estoque_minimo_padrao > 0 ? formatNumberBR(f.variante.estoque_minimo_padrao) : '—'} />
      <Campo rot="Custo unitário" val={formatCurrencyBRL(f.variante.custo_unitario ?? 0)} />
      <Campo rot="Fornecedor" val={fornecedor} />
      <Campo rot="Local com maior saldo" val={maior ? `${maior.unidadeNome} (${formatNumberBR(maior.quantidade)})` : '—'} />
      <Campo rot="Local com menor saldo" val={menor && ordenadas.length > 1 ? `${menor.unidadeNome} (${formatNumberBR(menor.quantidade)})` : '—'} />
      <Campo rot="Última entrada" val={det.loading ? '…' : ultEntrada ? `${formatDateBR(ultEntrada.createdAt)} (+${formatNumberBR(ultEntrada.quantidade)})` : '—'} />
      <Campo rot="Última saída" val={det.loading ? '…' : ultSaida ? `${formatDateBR(ultSaida.createdAt)} (−${formatNumberBR(ultSaida.quantidade)})` : '—'} />
    </dl>
  );
}

function UnidadesTab({ f }: { f: FardamentoRow }) {
  if (f.saldos.length === 0) return <EmptyState title="Sem saldo por local" description="Este item ainda não possui saldo em nenhum local de estoque." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-border/60 text-left text-xs text-muted-foreground"><th className="pb-2 pr-3 font-medium">Local</th><th className="pb-2 pr-3 text-right font-medium">Saldo</th><th className="pb-2 pr-3 text-right font-medium">Mínimo</th><th className="pb-2 font-medium">Situação</th></tr></thead>
        <tbody>
          {[...f.saldos].sort((a, b) => b.quantidade - a.quantidade).map((s) => (
            <tr key={s.unidadeId} className="border-b border-border/40 last:border-0">
              <td className="py-2.5 pr-3 text-foreground">{s.unidadeNome}</td>
              <td className="py-2.5 pr-3 text-right tabular-nums font-medium">{formatNumberBR(s.quantidade)}</td>
              <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground">{formatNumberBR(s.minimoEfetivo)}</td>
              <td className="py-2.5"><StatusBadge variant={STATUS_VARIANT[s.status]}>{STOCK_STATUS_LABEL[s.status]}</StatusBadge></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MovsTab({ det }: { det: ReturnType<typeof useFardamentoDetalhe> }) {
  if (det.loading) return <ListaSkeleton />;
  if (det.movs.length === 0) return <EmptyState title="Sem movimentações" description="Nenhuma movimentação registrada para este item." />;
  return (
    <ul className="space-y-2">
      {det.movs.map((m, i) => {
        const label = MOVEMENT_TYPE_LABEL[m.tipo as keyof typeof MOVEMENT_TYPE_LABEL] ?? m.tipo;
        const entrada = MOVEMENT_IS_ENTRADA[m.tipo as keyof typeof MOVEMENT_IS_ENTRADA] ?? true;
        return (
          <li key={i} className="rounded-lg border border-border/60 p-3 text-sm">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2"><StatusBadge variant={entrada ? 'success' : 'warning'}>{label}</StatusBadge><span className="font-mono text-xs text-muted-foreground">{m.numero}</span></div>
              <span className="tabular-nums font-medium">{m.direcao === 'IN' ? '+' : '−'}{formatNumberBR(m.quantidade)}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span>Saldo: {formatNumberBR(m.saldoAnterior)} → {formatNumberBR(m.saldoPosterior)}</span>
              <span>{formatDateTimeBR(m.createdAt)}</span>
              <span>{m.operadorNome}</span>
            </div>
            {m.observacao && <p className="mt-1 text-xs text-muted-foreground">{m.observacao}</p>}
          </li>
        );
      })}
    </ul>
  );
}

function EntregasTab({ det }: { det: ReturnType<typeof useFardamentoDetalhe> }) {
  if (det.loading) return <ListaSkeleton />;
  if (det.entregas.length === 0) return <EmptyState title="Sem entregas" description="Este item não foi entregue a nenhum colaborador." />;
  return (
    <ul className="space-y-2">
      {det.entregas.map((e, i) => (
        <li key={i} className="flex items-center justify-between gap-2 rounded-lg border border-border/60 p-3 text-sm">
          <div className="min-w-0">
            <div className="truncate font-medium text-foreground">{e.funcionarioNome}</div>
            <div className="truncate text-xs text-muted-foreground">{e.recibo} · {DELIVERY_TYPE_LABEL[e.tipo as DeliveryType] ?? e.tipo} · {formatDateBR(e.createdAt)}</div>
          </div>
          <span className="shrink-0 tabular-nums font-medium">{formatNumberBR(e.quantidade)}</span>
        </li>
      ))}
    </ul>
  );
}

function DevolucoesTab({ det }: { det: ReturnType<typeof useFardamentoDetalhe> }) {
  if (det.loading) return <ListaSkeleton />;
  if (det.devolucoes.length === 0) return <EmptyState title="Sem devoluções" description="Nenhuma devolução registrada para este item." />;
  return (
    <ul className="space-y-2">
      {det.devolucoes.map((d, i) => (
        <li key={i} className="rounded-lg border border-border/60 p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-foreground">{d.recibo}</span>
            <span className="tabular-nums font-medium">{formatNumberBR(d.quantidade)}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <StatusBadge variant="neutral">{RETURN_CONDITION_LABEL[d.condicao as ReturnCondition] ?? d.condicao}</StatusBadge>
            <span>→ {RETURN_DESTINATION_LABEL[d.destino as ReturnDestination] ?? d.destino}</span>
            <span>· {formatDateBR(d.createdAt)}</span>
            {d.status === 'ESTORNADA' && <StatusBadge variant="warning">Estornada</StatusBadge>}
          </div>
        </li>
      ))}
    </ul>
  );
}

function Campo({ rot, val, destaque }: { rot: string; val: string; destaque?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{rot}</dt>
      <dd className={destaque ? 'text-lg font-bold tabular-nums text-foreground' : 'font-medium text-foreground'}>{val}</dd>
    </div>
  );
}

function ListaSkeleton() {
  return <div className="space-y-2">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>;
}
