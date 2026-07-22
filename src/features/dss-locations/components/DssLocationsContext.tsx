import { MapPin, Users, UserX, CalendarCheck } from 'lucide-react';
import { formatNumberBR, pluralizeBR } from '@/lib/formatters';
import { formatDateBR } from '@/lib/dateTime';
import type { DssLocationContext as Ctx } from '../domain/dssLocationFilters';

interface Props { context: Ctx; onSemLocal: () => void }

/** Faixa compacta de contexto (poucos registros — sem cards grandes). */
export function DssLocationsContext({ context, onSemLocal }: Props) {
  const semLocal = context.funcionariosSemLocal;
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl border border-border/70 bg-card px-4 py-3 text-sm shadow-[var(--shadow-card)]">
      <Item icon={MapPin} label={pluralizeBR(context.locais, 'local', 'locais')} />
      <Sep />
      <Item icon={Users} label={`${formatNumberBR(context.funcionariosVinculados)} vinculados`} />
      <Sep />
      {semLocal > 0 ? (
        <button type="button" onClick={onSemLocal} className="inline-flex items-center gap-1.5 rounded-md px-1 text-status-warning hover:underline">
          <UserX className="h-4 w-4" /> {pluralizeBR(semLocal, 'funcionário sem local', 'funcionários sem local')}
        </button>
      ) : (
        <Item icon={UserX} label="Nenhum funcionário sem local" tone="positive" />
      )}
      <Sep />
      <Item icon={CalendarCheck} label={`${pluralizeBR(context.dssRealizados, 'DSS realizado', 'DSS realizados')}${context.ultimaData ? ` · último em ${formatDateBR(context.ultimaData)}` : ''}`} />
    </div>
  );
}

function Item({ icon: Icon, label, tone }: { icon: typeof MapPin; label: string; tone?: 'positive' }) {
  return <span className={`inline-flex items-center gap-1.5 ${tone === 'positive' ? 'text-success' : 'text-foreground'}`}><Icon className="h-4 w-4 text-muted-foreground/70" /> {label}</span>;
}
function Sep() { return <span className="hidden h-4 w-px bg-border/70 sm:inline-block" aria-hidden />; }
