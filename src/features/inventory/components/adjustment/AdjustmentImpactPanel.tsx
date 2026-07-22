import { ArrowUp, ArrowDown, Minus, CheckCircle2, Circle } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge } from '@/components/app/StatusBadge';
import { cn } from '@/lib/utils';
import { formatNumberBR, formatCurrencyBRL } from '@/lib/formatters';
import { statusEstoque, STOCK_STATUS_LABEL } from '../../domain/stockStatus';
import type { StockStatus } from '../../types/inventory.types';
import type { AdjustmentResult } from '../../types/inventory.types';
import type { FardamentoRow } from '../../types/db.types';

const VAR: Record<StockStatus, 'success' | 'warning' | 'danger'> = { NORMAL: 'success', ALERTA: 'warning', SEM_ESTOQUE: 'danger' };

interface Props {
  fardamento: FardamentoRow | null; unidadeNome: string | null; temContagem: boolean;
  saldoAtual: number; minimo: number; custo: number; temCusto: boolean;
  previa: { result?: AdjustmentResult; aviso?: string }; impactoFinanceiro: number | null;
}

export function AdjustmentImpactPanel({ fardamento, unidadeNome, temContagem, saldoAtual, minimo, custo, temCusto, previa, impactoFinanceiro }: Props) {
  const pronto = !!fardamento && !!unidadeNome;

  if (!pronto) {
    return (
      <SectionCard title="Prévia do ajuste" description="Selecione um item e uma unidade para visualizar o saldo atual e o impacto da contagem.">
        <ol className="space-y-2.5">
          <Passo n={1} ok={!!fardamento} texto="Selecione o item" />
          <Passo n={2} ok={!!unidadeNome} texto="Escolha a unidade" />
          <Passo n={3} ok={temContagem} texto="Informe a contagem física" />
        </ol>
      </SectionCard>
    );
  }

  const r = previa.result;
  const situacaoApos: StockStatus | null = r ? statusEstoque(r.saldoNovo, minimo) : null;

  return (
    <SectionCard title="Prévia do ajuste" description={`${fardamento!.variante.nome} · ${unidadeNome}`}>
      <div className="space-y-3">
        <div className="font-mono text-xs text-muted-foreground">{fardamento!.variante.codigo_interno}</div>

        {/* Diferença em destaque */}
        <div className={cn('rounded-lg border p-3 text-center',
          !r ? 'border-border/60 bg-muted/20' : r.direcao === 'IN' ? 'border-success/30 bg-success/5' : 'border-status-warning/30 bg-status-warning/5')}>
          {r ? (
            <>
              <div className={cn('flex items-center justify-center gap-1 text-2xl font-bold tabular-nums', r.direcao === 'IN' ? 'text-success' : 'text-status-warning')}>
                {r.direcao === 'IN' ? <ArrowUp className="h-5 w-5" /> : <ArrowDown className="h-5 w-5" />}{r.diferenca > 0 ? '+' : ''}{formatNumberBR(r.diferenca)} <span className="text-sm font-medium">peças</span>
              </div>
              <div className="mt-0.5 text-xs font-medium text-foreground">{r.direcao === 'IN' ? 'Ajuste de entrada' : 'Ajuste de saída'}</div>
              <div className="mt-2 flex items-center justify-center gap-2 text-sm tabular-nums text-muted-foreground">
                <span>{formatNumberBR(r.saldoAnterior)}</span><span aria-hidden>→</span><span className="font-semibold text-foreground">{formatNumberBR(r.saldoNovo)}</span><span className="text-xs">peças</span>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground"><Minus className="h-4 w-4" /> {temContagem ? (previa.aviso ?? 'Sem alteração') : 'Informe a contagem para ver o impacto'}</div>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <Linha rot="Saldo atual" val={`${formatNumberBR(saldoAtual)} pç`} />
          <Linha rot="Saldo final" val={r ? `${formatNumberBR(r.saldoNovo)} pç` : '—'} destaque />
          <Linha rot="Custo unitário" val={temCusto ? formatCurrencyBRL(custo) : '—'} />
          <Linha rot="Impacto estimado" val={impactoFinanceiro != null ? `${impactoFinanceiro > 0 ? '+' : ''}${formatCurrencyBRL(impactoFinanceiro)}` : (temCusto ? '—' : 'Indisponível')}
            tone={impactoFinanceiro != null ? (impactoFinanceiro >= 0 ? 'pos' : 'neg') : undefined} />
        </dl>

        <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-sm">
          <span className="text-muted-foreground">Situação após ajuste</span>
          {situacaoApos ? <StatusBadge variant={VAR[situacaoApos]}>{STOCK_STATUS_LABEL[situacaoApos]}</StatusBadge> : <span className="text-muted-foreground">—</span>}
        </div>
        {!temCusto && <p className="text-[11px] text-muted-foreground">Custo não cadastrado — impacto financeiro indisponível.</p>}
      </div>
    </SectionCard>
  );
}

function Passo({ n, ok, texto }: { n: number; ok: boolean; texto: string }) {
  return (
    <li className="flex items-center gap-2.5 text-sm">
      {ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground/50" />}
      <span className={cn(ok ? 'text-foreground line-through decoration-muted-foreground/40' : 'text-muted-foreground')}><span className="mr-1 font-medium">{n}.</span>{texto}</span>
    </li>
  );
}

function Linha({ rot, val, destaque, tone }: { rot: string; val: string; destaque?: boolean; tone?: 'pos' | 'neg' }) {
  const c = tone === 'pos' ? 'text-success' : tone === 'neg' ? 'text-status-warning' : 'text-foreground';
  return <div><dt className="text-xs text-muted-foreground">{rot}</dt><dd className={cn('tabular-nums', destaque ? 'text-lg font-bold' : 'font-medium', c)}>{val}</dd></div>;
}
