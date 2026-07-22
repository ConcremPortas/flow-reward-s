import { formatPercentBR } from '@/lib/formatters';
import type { TraceEntry } from '../types/rewards-processing.types';

/**
 * Memória de cálculo OBSERVACIONAL — deriva dos mesmos valores que o motor
 * consumiu. Não recalcula nada e não participa da decisão do cálculo.
 */
export function RewardCalculationTrace({ trace }: { trace: TraceEntry[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border/70">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
            <th className="px-3 py-2 font-medium">Critério</th>
            <th className="px-3 py-2 font-medium">Entrada</th>
            <th className="px-3 py-2 text-right font-medium">Nota</th>
          </tr>
        </thead>
        <tbody>
          {trace.map((t, i) => (
            <tr key={`${t.key}-${i}`} className="border-t border-border/50">
              <td className="px-3 py-2 font-medium text-foreground">{t.label}</td>
              <td className="px-3 py-2 text-muted-foreground">
                {t.entrada ?? '—'}
                {t.observacao && <span className="block text-[11px] text-muted-foreground/70">{t.observacao}</span>}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-foreground">{t.nota != null ? formatPercentBR(t.nota * 100, 1) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
