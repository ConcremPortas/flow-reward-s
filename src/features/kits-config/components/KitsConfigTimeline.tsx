import { SectionCard } from '@/components/app/SectionCard';
import { KitsConfigTimelineItem, type KitsConfigRowHandlers } from './KitsConfigTimelineItem';
import type { KitsConfigRow } from '../types/kits-config.types';

/** Linha do tempo — configurações em ordem decrescente de vigência. */
export function KitsConfigTimeline({ rows, handlers }: { rows: KitsConfigRow[]; handlers: KitsConfigRowHandlers }) {
  return (
    <SectionCard title="Linha do tempo de vigências" description="Regras em ordem decrescente. Cada uma vale até o mês anterior à próxima.">
      <div className="space-y-2.5">
        {rows.map(r => <KitsConfigTimelineItem key={r.id} row={r} handlers={handlers} />)}
      </div>
    </SectionCard>
  );
}
