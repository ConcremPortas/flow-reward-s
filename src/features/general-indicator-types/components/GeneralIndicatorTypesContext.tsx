import { Layers, CheckCircle2, Activity, CalendarClock } from 'lucide-react';
import { formatNumberBR, pluralizeBR } from '@/lib/formatters';
import { formatMonthYearBR } from '@/lib/dateTime';
import type { GeneralIndicatorTypeContext as Ctx } from '../domain/generalIndicatorTypeFilters';

/** Faixa compacta de contexto (poucos registros — sem cards grandes). */
export function GeneralIndicatorTypesContext({ context }: { context: Ctx }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border/70 bg-card px-4 py-3 text-sm shadow-[var(--shadow-card)]">
      <Item icon={Layers} label={pluralizeBR(context.total, 'indicador cadastrado', 'indicadores cadastrados')} />
      <Sep />
      <Item icon={CheckCircle2} label={`${formatNumberBR(context.ativos)} ${context.ativos === 1 ? 'ativo' : 'ativos'}`} tone="positive" />
      <Sep />
      <Item icon={Activity} label={pluralizeBR(context.totalMedicoes, 'medição', 'medições')} />
      <Sep />
      <Item icon={CalendarClock} label={`Última competência: ${context.ultimaCompetencia ? formatMonthYearBR(context.ultimaCompetencia) : '—'}`} />
    </div>
  );
}

function Item({ icon: Icon, label, tone }: { icon: typeof Layers; label: string; tone?: 'positive' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${tone === 'positive' ? 'text-success' : 'text-foreground'}`}>
      <Icon className="h-4 w-4 text-muted-foreground/70" /> {label}
    </span>
  );
}
function Sep() {
  return <span className="hidden h-4 w-px bg-border/70 sm:inline-block" aria-hidden />;
}
