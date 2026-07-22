import { useState } from 'react';
import { CheckCircle2, Circle, FileText, ArrowRight, ShieldCheck } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge } from '@/components/app/StatusBadge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatNumberBR, formatCurrencyBRL } from '@/lib/formatters';
import { STOCK_STATUS_LABEL } from '../../domain/stockStatus';
import type { StockStatus } from '../../types/inventory.types';
import type { DeliveryItemRow } from '../../hooks/useStockDelivery';
import type { Funcionario } from '@/hooks/useFuncionarios';

const VAR: Record<StockStatus, 'success' | 'warning' | 'danger'> = { NORMAL: 'success', ALERTA: 'warning', SEM_ESTOQUE: 'danger' };

interface Props {
  funcionario: Funcionario | null; unidadeNome: string | null; tipoLabel: string;
  rows: DeliveryItemRow[]; totais: { distintos: number; pecas: number; valor: number; semCusto: number };
  observacao: string; usuario: string; itensValidos: boolean; onAbrirTermo: () => void;
}

export function StockDeliverySummary({ funcionario, unidadeNome, tipoLabel, rows, totais, observacao, usuario, itensValidos, onAbrirTermo }: Props) {
  const [exp, setExp] = useState(false);
  const vazio = !funcionario && !unidadeNome && rows.length === 0;

  if (vazio) {
    return (
      <SectionCard title="Resumo da entrega" description="Preencha os dados para montar a entrega.">
        <ol className="space-y-2.5">
          <Passo ok={!!unidadeNome} texto="Selecione a unidade" />
          <Passo ok={!!tipoLabel} texto="Escolha o tipo" />
          <Passo ok={!!funcionario} texto="Selecione o colaborador" />
          <Passo ok={rows.length > 0 && itensValidos} texto="Adicione os itens" />
          <Passo ok={false} texto="Revise o termo e confirme" />
        </ol>
      </SectionCard>
    );
  }
  const visiveis = exp ? rows : rows.slice(0, 4);

  return (
    <div className="space-y-5">
      <SectionCard title="Resumo da entrega" description="Confira antes de revisar.">
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
          <Campo rot="Colaborador" val={funcionario?.nome ?? '—'} />
          <Campo rot="Empresa" val={funcionario?.empresa?.nome ?? '—'} />
          <Campo rot="Setor / Cargo" val={[funcionario?.setor?.nome, funcionario?.funcao?.nome].filter(Boolean).join(' · ') || '—'} />
          <Campo rot="Unidade" val={unidadeNome ?? '—'} />
          <Campo rot="Tipo" val={tipoLabel} />
          <Campo rot="Itens / Peças" val={`${formatNumberBR(totais.distintos)} / ${formatNumberBR(totais.pecas)}`} destaque />
          <Campo rot="Valor estimado" val={totais.valor > 0 ? formatCurrencyBRL(totais.valor) : 'Indisponível'} />
          <Campo rot="Responsável" val={usuario} />
        </dl>
        {observacao.trim() && <div className="mt-3 rounded-lg bg-muted/40 p-2.5"><p className="text-xs text-muted-foreground">Observação</p><p className="text-sm text-foreground">{observacao.trim()}</p></div>}
      </SectionCard>

      {rows.length > 0 && (
        <SectionCard title="Impacto nos saldos" description="Saldo previsto após a entrega.">
          <ul className="space-y-2">
            {visiveis.map((r) => (
              <li key={r.varianteId} className="flex items-center justify-between gap-2 text-sm">
                <span className="min-w-0 truncate text-foreground">{r.f.variante.nome}{r.f.tamanhoRotulo ? ` · ${r.f.tamanhoRotulo}` : ''}</span>
                <span className="flex shrink-0 items-center gap-1.5 tabular-nums"><span className="text-muted-foreground">{formatNumberBR(r.saldo)}</span><ArrowRight className="h-3 w-3 text-status-warning" /><span className={cn('font-semibold', r.excede ? 'text-destructive' : 'text-foreground')}>{formatNumberBR(r.saldoFinal)}</span><StatusBadge variant={VAR[r.statusDepois]}>{STOCK_STATUS_LABEL[r.statusDepois]}</StatusBadge></span>
              </li>
            ))}
          </ul>
          {rows.length > 4 && <button type="button" onClick={() => setExp((v) => !v)} className="mt-2 text-xs text-primary hover:underline">{exp ? 'Ver menos' : `Ver mais ${rows.length - 4}`}</button>}
        </SectionCard>
      )}

      <SectionCard title="Termo de responsabilidade" description="Gerado automaticamente ao confirmar a entrega.">
        <p className="flex items-start gap-2 text-xs text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Inclui colaborador, empresa, setor, cargo, itens, tamanhos, quantidades, data e o texto legal vigente. É imutável após a emissão.</p>
        <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={onAbrirTermo} disabled={!funcionario || rows.length === 0}><FileText className="h-4 w-4" /> Ver prévia do termo</Button>
      </SectionCard>
    </div>
  );
}

function Passo({ ok, texto }: { ok: boolean; texto: string }) {
  return <li className="flex items-center gap-2.5 text-sm">{ok ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Circle className="h-4 w-4 text-muted-foreground/50" />}<span className={cn(ok ? 'text-foreground' : 'text-muted-foreground')}>{texto}</span></li>;
}
function Campo({ rot, val, destaque }: { rot: string; val: string; destaque?: boolean }) {
  return <div><dt className="text-xs text-muted-foreground">{rot}</dt><dd className={cn('truncate', destaque ? 'text-base font-bold text-foreground' : 'font-medium text-foreground')}>{val}</dd></div>;
}
