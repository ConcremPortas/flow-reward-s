import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { formatCurrencyBRL, formatPercentBR } from '@/lib/formatters';
import { competenciaLabelLong } from '@/features/dashboard/utils/dates';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
// Reutiliza a MESMA memória de cálculo do fluxo de processamento (sem duplicar).
import { traceFromResultado } from '@/features/rewards-processing/domain/rewardsCalculationTrace';
import { RewardCalculationTrace } from '@/features/rewards-processing/components/RewardCalculationTrace';
import { valorFinal, diferenca } from '../domain/rewardsReportMetrics';

interface Props {
  result: ResultadoPremiacao | null;
  baseNome: string | null;
  onClose: () => void;
}

/** Drawer de memória de cálculo — mesmo padrão/trace do processamento, sobre o resultado salvo. */
export function RewardCalculationDrawer({ result, baseNome, onClose }: Props) {
  if (!result) return <Sheet open={false} onOpenChange={() => {}}><SheetContent /></Sheet>;
  const r = result;
  const vf = valorFinal(r); const dif = diferenca(r); const competencia = (r.mes_competencia ?? '').slice(0, 7);

  return (
    <Sheet open={!!result} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[620px]">
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="truncate">{r.nome}</SheetTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {r.cod_funcionario} · {r.setor || '—'}{r.funcao ? ` · ${r.funcao}` : ''} · {r.categoria || '—'}
            {baseNome ? ` · ${baseNome}` : ''} · {competenciaLabelLong(competencia)}
          </p>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Nota final" value={formatPercentBR(r.nota_geral * 100, 1)} />
            <Field label="Faixa" value={r.faixa || '—'} />
            <Field label="Bônus possível" value={formatCurrencyBRL(r.bonus_possivel || 0)} />
            <Field label="Bônus alcançado" value={formatCurrencyBRL(r.bonus_alcancado || 0)} />
            <Field label="Valor final" value={formatCurrencyBRL(vf)} highlight />
            <Field label="Diferença" value={formatCurrencyBRL(dif)} tone={dif < 0 ? 'down' : dif > 0 ? 'up' : undefined} />
          </div>

          {r.valor_ajustado != null && r.observacao_ajuste && (
            <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-xs">
              <p className="font-semibold text-foreground">Ajuste manual</p>
              <p className="mt-0.5 text-muted-foreground">{r.observacao_ajuste}</p>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Memória de cálculo</p>
            <RewardCalculationTrace trace={traceFromResultado(r)} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value, highlight, tone }: { label: string; value: string; highlight?: boolean; tone?: 'up' | 'down' }) {
  return (
    <div className={cn('rounded-lg border p-2.5', highlight ? 'border-[#c8a83f]/40 bg-[#f7f0d7]/30' : 'border-border/70')}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={cn('mt-0.5 truncate text-sm font-semibold', highlight ? 'text-[#7a5f16]' : tone === 'up' ? 'text-success' : tone === 'down' ? 'text-destructive' : 'text-foreground')}>{value}</p>
    </div>
  );
}
