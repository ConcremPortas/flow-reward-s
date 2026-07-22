import { ArrowLeft, ShieldCheck, AlertTriangle, Loader2, Save } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCurrencyBRL } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import { competenciaLabelLong } from '@/features/dashboard/utils/dates';
import type { ExistingProcessing, RewardsPreview } from '../types/rewards-processing.types';

interface Props {
  preview: RewardsPreview;
  baseNomes: string[];
  existings: ExistingProcessing[];
  saving: boolean;
  error: string | null;
  onBack: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

/** Etapa 4 — confirmação. Alerta de sobrescrita destacado; sem window.confirm. */
export function RewardsConfirmationStep({ preview, baseNomes, existings, saving, error, onBack, onCancel, onConfirm }: Props) {
  const t = preview.totals;
  const overwrite = existings.length > 0;
  const valorAnterior = existings.reduce((s, e) => s + e.valorTotal, 0);
  const diff = t.valorTotal - valorAnterior;

  return (
    <div className="space-y-4">
      <SectionCard title="Resumo do processamento">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Item label="Competência" value={competenciaLabelLong(preview.competencia)} />
          <Item label="Base(s)" value={baseNomes.join(', ')} />
          <Item label="Categorias" value={preview.categoriaIds.length === 0 ? 'Todas' : `${preview.categoriaIds.length}`} />
          <Item label="Funcionários processados" value={String(t.funcionariosCalculados)} />
          <Item label="Com premiação" value={String(t.comBonus)} />
          <Item label="Sem premiação" value={String(t.semBonus)} />
          <div className="col-span-2 rounded-lg border border-[#c8a83f]/40 bg-[#f7f0d7]/40 p-3">
            <p className="text-[11px] text-[#8a6d1f]">Valor total</p>
            <p className="mt-0.5 text-lg font-bold text-[#7a5f16]">{formatCurrencyBRL(t.valorTotal)}</p>
          </div>
        </div>
      </SectionCard>

      <div className={cn('flex items-start gap-3 rounded-xl border p-4', overwrite ? 'border-status-warning/40 bg-status-warning/[0.05]' : 'border-primary/20 bg-primary/[0.04]')}>
        <span className={cn('mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg', overwrite ? 'bg-status-warning/10 text-status-warning' : 'bg-primary/10 text-primary')}>
          {overwrite ? <AlertTriangle className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
        </span>
        <div className="min-w-0 flex-1">
          {overwrite ? (
            <>
              <p className="text-sm font-semibold text-foreground">Este processamento substituirá um cálculo existente.</p>
              <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {existings.map(e => (
                  <li key={e.baseId}>
                    {e.baseNome}: {e.resultados} resultado(s) · {formatCurrencyBRL(e.valorTotal)}
                    {e.processadoEm ? ` · ${formatDateTimeBR(e.processadoEm)}` : ''}
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-xs">
                <span className="text-muted-foreground">Anterior {formatCurrencyBRL(valorAnterior)} → novo {formatCurrencyBRL(t.valorTotal)} · </span>
                <span className={cn('font-medium', diff > 0 ? 'text-success' : diff < 0 ? 'text-destructive' : 'text-muted-foreground')}>{diff >= 0 ? '+' : '−'}{formatCurrencyBRL(Math.abs(diff))}</span>
              </p>
            </>
          ) : (
            <p className="text-sm font-semibold text-foreground">Este processamento será salvo no sistema.</p>
          )}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center justify-between gap-2">
        <Button variant="ghost" className="gap-1.5" onClick={onBack} disabled={saving}><ArrowLeft className="h-4 w-4" /> Prévia</Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>Cancelar</Button>
          <Button className="gap-1.5" onClick={onConfirm} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'Processando...' : 'Confirmar processamento'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
