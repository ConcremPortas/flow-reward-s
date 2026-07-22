import { RewardsValidationItem } from './RewardsValidationItem';
import type { ValidationGroup } from '../types/rewards-processing.types';

export function RewardsValidationGroup({ group, onNavigate }: { group: ValidationGroup; onNavigate: (to: string) => void }) {
  if (group.items.length === 0) return null;
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</p>
      <div className="space-y-2">
        {group.items.map((item, i) => <RewardsValidationItem key={`${item.code}-${i}`} item={item} onNavigate={onNavigate} />)}
      </div>
    </div>
  );
}
