import { UserCog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pluralizeBR } from '@/lib/formatters';
import { SectorRegistrationStatus } from './SectorRegistrationStatus';
import type { LeadershipGroupData, SectorRow } from '../types/sector.types';

interface Props { group: LeadershipGroupData; onOpenSetor: (r: SectorRow) => void }

export function LeadershipGroup({ group, onOpenSetor }: Props) {
  const semSupervisor = group.supervisorId === null;
  return (
    <div className={cn('rounded-xl border bg-card p-4', semSupervisor ? 'border-status-warning/30' : 'border-border/70')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-lg', semSupervisor ? 'bg-status-warning/10 text-status-warning' : 'bg-primary/10 text-primary')}><UserCog className="h-4 w-4" /></span>
          <p className={cn('text-sm font-semibold', semSupervisor ? 'text-status-warning' : 'text-foreground')}>{group.supervisorNome}</p>
        </div>
        <p className="text-xs text-muted-foreground">
          {pluralizeBR(group.setores.length, 'setor', 'setores')} · {pluralizeBR(group.encarregadosUnicos, 'encarregado', 'encarregados')} · {pluralizeBR(group.funcionariosVinculados, 'funcionário', 'funcionários')}
        </p>
      </div>

      <div className="mt-3 overflow-x-auto rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/40 text-left text-xs text-muted-foreground">
            <th className="px-3 py-1.5 font-medium">Setor</th><th className="px-3 py-1.5 font-medium">Encarregado</th>
            <th className="px-3 py-1.5 text-right font-medium">Funcionários</th><th className="px-3 py-1.5 font-medium">Situação</th>
          </tr></thead>
          <tbody>
            {group.setores.map(s => (
              <tr key={s.id} className="cursor-pointer border-t border-border/50 hover:bg-muted/40" onClick={() => onOpenSetor(s)}>
                <td className="px-3 py-1.5 font-medium text-foreground">{s.nome}</td>
                <td className={cn('px-3 py-1.5', s.encarregadoNome ? 'text-muted-foreground' : 'text-status-warning')}>{s.encarregadoNome ?? 'Não definido'}</td>
                <td className="px-3 py-1.5 text-right tabular-nums">{s.links.funcionarios}</td>
                <td className="px-3 py-1.5"><SectorRegistrationStatus status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
