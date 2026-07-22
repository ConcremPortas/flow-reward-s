import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { WeightKey } from '../domain/rewardFormulaDefinitions';

interface Props {
  weightKey: WeightKey;
  label: string;
  value: number;
  onChange: (key: WeightKey, value: number) => void;
}

/** Campo de peso (0–100) com sufixo "%". Parsing pt-BR simples (vírgula/ponto). */
export function RewardFormulaWeightField({ weightKey, label, value, onChange }: Props) {
  const active = value > 0;
  return (
    <div className={cn('flex items-center justify-between gap-3 rounded-lg border px-3 py-2', active ? 'border-[#c8a83f]/40 bg-[#f7f0d7]/30' : 'border-border/70')}>
      <span className="min-w-0 truncate text-sm text-foreground">{label}</span>
      <div className="relative w-24 shrink-0">
        <Input
          inputMode="decimal" aria-label={`Peso de ${label} em %`}
          value={value === 0 ? '' : String(value).replace('.', ',')}
          placeholder="0"
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
            const n = raw === '' ? 0 : Number(raw);
            onChange(weightKey, Number.isFinite(n) ? n : 0);
          }}
          className="pr-6 text-right tabular-nums"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
      </div>
    </div>
  );
}
