import { useState } from 'react';
import { CheckCircle2, Circle, FileText, ArrowRight } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge } from '@/components/app/StatusBadge';
import { cn } from '@/lib/utils';
import { formatNumberBR, formatCurrencyBRL } from '@/lib/formatters';
import { formatDateBR } from '@/lib/dateTime';
import type { EntradaItemRow } from '../../hooks/useStockEntry';

interface Props {
  unidadeNome: string | null; data: string; rows: EntradaItemRow[];
  totais: { distintos: number; pecas: number; valor: number; semCusto: number };
  temNf: boolean; observacao: string; usuario: string; itensValidos: boolean;
}

export function StockEntrySummary({ unidadeNome, data, rows, totais, temNf, observacao, usuario, itensValidos }: Props) {
  const [expandido, setExpandido] = useState(false);
  const vazio = !unidadeNome && rows.length === 0;

  if (vazio) {
    return (
      <SectionCard title="Resumo da entrada" description="Preencha os dados para montar o recebimento.">
        <ol className="space-y-2.5">
          <Passo ok={!!unidadeNome} texto="Selecione a unidade" />
          <Passo ok={rows.length > 0} texto="Adicione os itens" />
          <Passo ok={rows.length > 0 && itensValidos} texto="Informe as quantidades" />
          <Passo ok={temNf} texto="Anexe a nota fiscal (opcional)" opcional />
          <Passo ok={false} texto="Revise e confirme" />
        </ol>
      </SectionCard>
    );
  }

  const visiveis = expandido ? rows : rows.slice(0, 4);

  return (
    <div className="space-y-5">
      <SectionCard title="Resumo da entrada" description="Confira antes de revisar.">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
          <Campo rot="Unidade" val={unidadeNome ?? '—'} />
          <Campo rot="Data de chegada" val={data ? formatDateBR(data) : '—'} />
          <Campo rot="Itens distintos" val={formatNumberBR(totais.distintos)} />
          <Campo rot="Total de peças" val={`${formatNumberBR(totais.pecas)} pç`} destaque />
          <Campo rot="Valor estimado" val={totais.valor > 0 ? formatCurrencyBRL(totais.valor) : 'Indisponível'} />
          <Campo rot="Responsável" val={usuario} />
        </dl>
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
          <StatusBadge variant={temNf ? 'success' : 'neutral'}><FileText className="mr-1 h-3 w-3" />{temNf ? 'NF anexada' : 'Sem NF'}</StatusBadge>
          {totais.semCusto > 0 && <StatusBadge variant="warning">{totais.semCusto} sem custo</StatusBadge>}
          <StatusBadge variant={itensValidos && rows.length > 0 ? 'success' : 'neutral'}>{itensValidos && rows.length > 0 ? 'Pronto para revisar' : 'Incompleto'}</StatusBadge>
        </div>
        {observacao.trim() && <div className="mt-3 rounded-lg bg-muted/40 p-2.5"><p className="text-xs text-muted-foreground">Observação</p><p className="text-sm text-foreground">{observacao.trim()}</p></div>}
      </SectionCard>

      {rows.length > 0 && (
        <SectionCard title="Impacto nos saldos" description="Saldo previsto após a entrada.">
          <ul className="space-y-2">
            {visiveis.map((r) => (
              <li key={r.varianteId} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate text-foreground">{r.f.variante.nome}{r.f.tamanhoRotulo ? ` · ${r.f.tamanhoRotulo}` : ''}</span>
                <span className="flex shrink-0 items-center gap-1.5 tabular-nums"><span className="text-muted-foreground">{formatNumberBR(r.saldoAtual)}</span><ArrowRight className="h-3 w-3 text-success" /><span className="font-semibold text-foreground">{formatNumberBR(r.saldoFinal)}</span></span>
              </li>
            ))}
          </ul>
          {rows.length > 4 && <button type="button" onClick={() => setExpandido((v) => !v)} className="mt-2 text-xs text-primary hover:underline">{expandido ? 'Ver menos' : `Ver mais ${rows.length - 4}`}</button>}
        </SectionCard>
      )}
    </div>
  );
}

function Passo({ ok, texto, opcional }: { ok: boolean; texto: string; opcional?: boolean }) {
  return <li className="flex items-center gap-2.5 text-sm">{ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground/50" />}<span className={cn(ok ? 'text-foreground' : 'text-muted-foreground')}>{texto}{opcional && <span className="ml-1 text-xs text-muted-foreground">(opcional)</span>}</span></li>;
}
function Campo({ rot, val, destaque }: { rot: string; val: string; destaque?: boolean }) {
  return <div><dt className="text-xs text-muted-foreground">{rot}</dt><dd className={cn('tabular-nums', destaque ? 'text-lg font-bold text-foreground' : 'font-medium text-foreground')}>{val}</dd></div>;
}
