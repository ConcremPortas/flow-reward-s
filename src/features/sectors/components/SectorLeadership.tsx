import { cn } from '@/lib/utils';
import type { SectorRow } from '../types/sector.types';

/**
 * Liderança agrupada (supervisor + encarregado) em uma coluna compacta. Ausência
 * só recebe alerta visual quando é pendência real (status pendente/atenção).
 */
export function SectorLeadership({ row }: { row: SectorRow }) {
  const isPendente = row.status.status !== 'completo';
  return (
    <div className="space-y-1.5">
      <Line label="Supervisor" nome={row.supervisorNome} alerta={!row.supervisorId && isPendente} />
      <Line label="Encarregado" nome={row.encarregadoNome} alerta={!row.encarregadoId && isPendente} />
    </div>
  );
}

function Line({ label, nome, alerta }: { label: string; nome: string | null; alerta: boolean }) {
  return (
    <div className="leading-tight">
      <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground/70">{label}</span>
      {nome ? (
        <span className="block text-sm text-foreground">{nome}</span>
      ) : (
        <span className={cn('block text-sm', alerta ? 'font-medium text-status-warning' : 'text-muted-foreground')}>{label} não definido</span>
      )}
    </div>
  );
}
