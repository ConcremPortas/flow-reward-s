import { LeadershipGroup } from './LeadershipGroup';
import type { LeadershipGroupData, SectorRow } from '../types/sector.types';

interface Props { groups: LeadershipGroupData[]; onOpenSetor: (r: SectorRow) => void }

export function LeadershipStructure({ groups, onOpenSetor }: Props) {
  if (groups.length === 0) return <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma estrutura de liderança para os filtros selecionados.</p>;
  return (
    <div className="space-y-3">
      {groups.map(g => <LeadershipGroup key={g.supervisorId ?? 'sem-supervisor'} group={g} onOpenSetor={onOpenSetor} />)}
    </div>
  );
}
