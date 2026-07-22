import { Minus, Plus, PackageCheck, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/app/StatusBadge';
import { EmptyState } from '@/components/app/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';
import { CONDICOES, DESTINOS, resultadoCombinacao } from './returnMeta';
import type { ReturnCondition, ReturnDestination } from '../../types/inventory.types';
import type { DisponivelItem } from '../../hooks/useStockReturns';

interface Props {
  hasEntrega: boolean; loadingDisp: boolean; disponiveis: DisponivelItem[];
  varianteId: string; setVarianteId: (id: string) => void;
  quantidadeRaw: string; setQuantidadeRaw: (v: string) => void; dispQtd: number; qtd: number; qtdValida: boolean; excede: boolean;
  condicao: ReturnCondition; setCondicao: (c: ReturnCondition) => void;
  destino: ReturnDestination; setDestino: (d: ReturnDestination) => void;
  motivo: string; setMotivo: (v: string) => void; motivoObrigatorio: boolean; motivoMax: number;
}

export function ReturnForm(p: Props) {
  if (!p.hasEntrega) return <EmptyState icon={PackageCheck} title="Selecione uma entrega" description="Escolha uma entrega de origem à esquerda para iniciar a devolução." />;
  if (p.loadingDisp) return <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>;
  if (p.disponiveis.length === 0) return <EmptyState icon={PackageCheck} title="Nada disponível" description="Todos os itens desta entrega já foram devolvidos." />;

  const restante = p.qtdValida ? p.dispQtd - p.qtd : p.dispQtd;
  const comb = resultadoCombinacao(p.condicao, p.destino);

  return (
    <div className="space-y-5">
      {/* Itens disponíveis */}
      <div>
        <Label className="mb-2 block text-sm">Item a devolver *</Label>
        <ul className="space-y-2">
          {p.disponiveis.map((d) => {
            const zerado = d.disponivel <= 0;
            const ativo = p.varianteId === d.varianteId;
            return (
              <li key={d.varianteId}>
                <button type="button" disabled={zerado} onClick={() => p.setVarianteId(d.varianteId)}
                  className={cn('w-full rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    ativo ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border/60 hover:bg-muted/40', zerado && 'cursor-not-allowed opacity-60')}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="min-w-0"><span className="block truncate text-sm font-medium text-foreground">{d.nome}</span><span className="block truncate font-mono text-xs text-muted-foreground">{d.codigo}</span></span>
                    {zerado ? <StatusBadge variant="neutral">Devolução concluída</StatusBadge> : <StatusBadge variant="success">{formatNumberBR(d.disponivel)} disp.</StatusBadge>}
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">Entregue {formatNumberBR(d.entregue)} · já devolvido {formatNumberBR(d.devolvido)}</div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {p.varianteId && (
        <>
          {/* Quantidade */}
          <div className="space-y-1.5">
            <Label htmlFor="qtd-dev" className="text-sm">Quantidade a devolver *</Label>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => p.setQuantidadeRaw(String(Math.max(1, (Number(p.quantidadeRaw) || 1) - 1)))} aria-label="Diminuir"><Minus className="h-4 w-4" /></Button>
              <Input id="qtd-dev" type="number" inputMode="numeric" min={1} max={p.dispQtd} step={1} value={p.quantidadeRaw} onChange={(e) => p.setQuantidadeRaw(e.target.value)}
                className={cn('h-9 w-24 text-center tabular-nums', p.excede && 'border-destructive focus-visible:ring-destructive')} aria-describedby="qtd-dev-info" />
              <Button type="button" variant="outline" size="icon" className="h-9 w-9" onClick={() => p.setQuantidadeRaw(String(Math.min(p.dispQtd, (Number(p.quantidadeRaw) || 0) + 1)))} aria-label="Aumentar" disabled={p.qtd >= p.dispQtd}><Plus className="h-4 w-4" /></Button>
              <span id="qtd-dev-info" className="text-sm text-muted-foreground">de <strong className="tabular-nums text-foreground">{formatNumberBR(p.dispQtd)}</strong> disponíveis · restam <strong className="tabular-nums text-foreground">{formatNumberBR(Math.max(0, restante))}</strong></span>
            </div>
            {p.excede && <p className="text-xs text-destructive">Saldo insuficiente nesta unidade — máximo {formatNumberBR(p.dispQtd)} peças.</p>}
          </div>

          {/* Condição */}
          <fieldset className="space-y-2"><legend className="text-sm font-medium text-foreground">Condição do item *</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {CONDICOES.map((c) => { const Icon = c.icon; const on = p.condicao === c.key; return (
                <button key={c.key} type="button" onClick={() => p.setCondicao(c.key)} aria-pressed={on}
                  className={cn('flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', on ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border/60 hover:bg-muted/40')}>
                  <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', c.reaproveitavel ? 'text-success' : 'text-status-warning')} />
                  <span><span className="flex items-center gap-1.5 text-sm font-medium text-foreground">{c.label}{c.reaproveitavel && <StatusBadge variant="success">reaproveitável</StatusBadge>}</span><span className="block text-xs text-muted-foreground">{c.desc}</span></span>
                </button>
              ); })}
            </div>
          </fieldset>

          {/* Destino */}
          <fieldset className="space-y-2"><legend className="text-sm font-medium text-foreground">Destino *</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {DESTINOS.map((dd) => { const Icon = dd.icon; const on = p.destino === dd.key; const col = dd.tone === 'success' ? 'text-success' : dd.tone === 'danger' ? 'text-destructive' : 'text-[hsl(217_90%_45%)]'; return (
                <button key={dd.key} type="button" onClick={() => p.setDestino(dd.key)} aria-pressed={on}
                  className={cn('flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', on ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border/60 hover:bg-muted/40')}>
                  <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', col)} />
                  <span><span className="block text-sm font-medium text-foreground">{dd.label}</span><span className="block text-xs text-muted-foreground">{dd.desc}</span></span>
                </button>
              ); })}
            </div>
          </fieldset>

          {/* Combinação */}
          <div aria-live="polite" className={cn('flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm',
            comb.tone === 'success' ? 'border-success/30 bg-success/5' : comb.tone === 'warning' ? 'border-status-warning/30 bg-status-warning/5' : 'border-[hsl(217_90%_55%)]/30 bg-[hsl(217_90%_55%)]/5')}>
            {comb.reentra ? <PackageCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" /> : <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
            <span className="text-foreground/90">{comb.texto}</span>
          </div>

          {/* Motivo */}
          <div className="space-y-1.5">
            <Label htmlFor="motivo-dev" className="text-sm">Motivo / observação {p.motivoObrigatorio && '*'}</Label>
            <Textarea id="motivo-dev" rows={2} maxLength={p.motivoMax} value={p.motivo} onChange={(e) => p.setMotivo(e.target.value)}
              placeholder="Ex.: desligamento; troca de tamanho; desgaste; danificação; devolução voluntária..." aria-invalid={p.motivoObrigatorio && p.motivo.trim().length < 3} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{p.motivoObrigatorio ? 'Recomendado para este destino/condição.' : 'Ficará registrado na devolução e auditoria.'}</span>
              <span className="tabular-nums">{p.motivo.length}/{p.motivoMax}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
