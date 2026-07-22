import { CurrentKitsRule } from '../components/CurrentKitsRule';
import { KitsConfigContext } from '../components/KitsConfigContext';
import { KitsConfigTimeline } from '../components/KitsConfigTimeline';
import type { KitsConfigRowHandlers } from '../components/KitsConfigTimelineItem';
import type { KitsConfigRow } from '../types/kits-config.types';

interface Props {
  rows: KitsConfigRow[];
  atual: KitsConfigRow | null;
  proxima: KitsConfigRow | null;
  handlers: KitsConfigRowHandlers;
  onNovaVigencia: () => void;
}

export function KitsConfigRulesView({ rows, atual, proxima, handlers, onNovaVigencia }: Props) {
  return (
    <div className="space-y-[18px]">
      <CurrentKitsRule atual={atual} proxima={proxima} onSimular={handlers.onSimular} onNovaVigencia={onNovaVigencia} />
      <KitsConfigContext rows={rows} atual={atual} proxima={proxima} />
      <KitsConfigTimeline rows={rows} handlers={handlers} />
    </div>
  );
}
