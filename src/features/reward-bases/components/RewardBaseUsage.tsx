import type { RewardBaseUsage as Usage } from '../types/reward-base.types';

/** Rótulo textual do estado de utilização (Em uso / Sem vínculo / Somente histórico). */
export function RewardBaseUsage({ usage }: { usage: Usage }) {
  if (usage.emUso) return <span className="text-sm text-foreground">Em uso</span>;
  if (usage.somenteHistorico) return <span className="text-sm text-status-warning">Somente histórico</span>;
  return <span className="text-sm text-muted-foreground">Sem vínculo</span>;
}
