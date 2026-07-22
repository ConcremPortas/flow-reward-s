import { pluralizeBR } from '@/lib/formatters';
import type { GeneralIndicatorTypeUsage as Usage } from '../types/general-indicator-type.types';

/** Rótulo textual da utilização (medições / competências). */
export function GeneralIndicatorTypeUsage({ usage }: { usage: Usage }) {
  if (usage.medicoes === 0) return <span className="text-sm text-muted-foreground">Sem medição</span>;
  return (
    <span className="text-sm text-foreground">
      {pluralizeBR(usage.medicoes, 'medição', 'medições')}
      <span className="ml-1 text-muted-foreground">· {pluralizeBR(usage.competencias, 'competência', 'competências')}</span>
    </span>
  );
}
