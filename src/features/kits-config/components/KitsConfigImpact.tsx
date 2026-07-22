import { CalendarClock, AlertTriangle } from 'lucide-react';
import { competenciaLabelLong, shiftCompetencia } from '@/features/dashboard/utils/dates';
import { pluralizeBR } from '@/lib/formatters';
import type { KitsConfigRow } from '../types/kits-config.types';

interface Props {
  novaVigencia: string;               // 'YYYY-MM'
  atual: KitsConfigRow | null;
  competenciaAtual: string;
  retro: { competencias: string[]; resultados: number };
}

/** Explica o período efetivo e alerta sobre retroatividade. */
export function KitsConfigImpact({ novaVigencia, atual, competenciaAtual, retro }: Props) {
  const isFutura = novaVigencia > competenciaAtual;
  const isRetro = retro.competencias.length > 0;

  return (
    <div className="space-y-2">
      <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"><CalendarClock className="h-3.5 w-3.5" /> Período efetivo</p>
        {atual && isFutura && (
          <p className="mt-1 text-foreground">A configuração atual permanecerá válida até {competenciaLabelLong(shiftCompetencia(novaVigencia, -1))}.</p>
        )}
        <p className="mt-1 text-foreground">A nova configuração será aplicada a competências a partir de {competenciaLabelLong(novaVigencia)}.</p>
        <p className="mt-1 text-xs text-muted-foreground">Premiações já geradas não serão recalculadas (os resultados não guardam snapshot da configuração).</p>
      </div>

      {isRetro && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <p className="flex items-center gap-1.5 font-semibold text-destructive"><AlertTriangle className="h-4 w-4" /> Vigência retroativa</p>
          <p className="mt-1 text-foreground">Esta vigência é anterior ou igual a competências já processadas: {retro.competencias.map(competenciaLabelLong).join(', ')}.</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{pluralizeBR(retro.resultados, 'resultado histórico', 'resultados históricos')} nessas competências. Novos processamentos passariam a usar esta regra; os já salvos não mudam. Confirme com atenção.</p>
        </div>
      )}
    </div>
  );
}
