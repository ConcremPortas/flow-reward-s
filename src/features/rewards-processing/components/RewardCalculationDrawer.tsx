import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { formatCurrencyBRL, formatPercentBR } from '@/lib/formatters';
import { competenciaLabelLong } from '@/features/dashboard/utils/dates';
import { RewardCalculationTrace } from './RewardCalculationTrace';
import type { RewardResult } from '../types/rewards-processing.types';

interface Props {
  employee: RewardResult | null;
  baseNome: string;
  competencia: string;
  onClose: () => void;
}

/** Drawer de memória de cálculo de um funcionário (observacional). */
export function RewardCalculationDrawer({ employee, baseNome, competencia, onClose }: Props) {
  if (!employee) return <Sheet open={false} onOpenChange={() => {}}><SheetContent /></Sheet>;
  const e = employee;
  return (
    <Sheet open={!!employee} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[620px]">
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="truncate">{e.nome}</SheetTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">{e.setor} · {e.categoria} · {baseNome} · {competenciaLabelLong(competencia)}</p>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-3 gap-3">
            <Field label="Nota final" value={formatPercentBR(e.nota_geral * 100, 1)} />
            <Field label="Faixa" value={e.faixa} />
            <Field label="Bônus calculado" value={formatCurrencyBRL(e.bonus_alcancado)} highlight />
          </div>

          {e.flags.length > 0 && (
            <div className="rounded-lg border border-status-warning/30 bg-status-warning/5 p-2.5 text-xs text-status-warning">
              {e.flags.map((f, i) => <p key={i}>{f}</p>)}
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Memória de cálculo</p>
            <RewardCalculationTrace trace={e.trace} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-2.5 ${highlight ? 'border-[#c8a83f]/40 bg-[#f7f0d7]/30' : 'border-border/70'}`}>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={`mt-0.5 truncate text-sm font-semibold ${highlight ? 'text-[#7a5f16]' : 'text-foreground'}`}>{value}</p>
    </div>
  );
}
