import { formatParameter, TIPO_META } from '../domain/rewardBaseFormatting';
import type { RewardBaseTipo } from '../types/reward-base.types';

/** Parâmetro formatado conforme o tipo (percentual → %; valor_fixo → BRL). */
export function RewardBaseParameter({ tipo, valor }: { tipo: RewardBaseTipo; valor: number }) {
  return <span className="tabular-nums font-semibold text-[#7a5f16]">{formatParameter(tipo, valor)}</span>;
}

/** Badge discreto do tipo. */
export function RewardBaseTipoBadge({ tipo }: { tipo: RewardBaseTipo }) {
  return (
    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      {TIPO_META[tipo].label}
    </span>
  );
}
