import { ShieldCheck, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatPercentBR } from '@/lib/formatters';
import { hasAnomaly } from '../domain/indicatorDataQuality';
import type { GeneralIndicatorCardData } from '../types/general-indicators.types';

interface Props {
  cards: GeneralIndicatorCardData[];
  onReview: (card: GeneralIndicatorCardData) => void;
}

/**
 * Qualidade e cobertura dos dados. Só SINALIZA possíveis inconsistências (sem
 * alterar valores nem status de negócio) e mede a cobertura das últimas 12
 * competências. A ação "Revisar registro" abre o registro para conferência.
 */
export function GeneralIndicatorsDataQuality({ cards, onReview }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => {
        const cobertura = (card.serie.length / 12) * 100;
        const anomalia = hasAnomaly(card.quality);
        return (
          <div key={card.tipoId} className="rounded-xl border border-border/70 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-foreground">{card.nome}</p>
              {anomalia
                ? <AlertTriangle className="h-4 w-4 text-status-warning" />
                : <ShieldCheck className="h-4 w-4 text-success" />}
            </div>

            <div className="mt-2">
              <p className="text-xs text-muted-foreground">Cobertura (12 meses): {card.serie.length}/12 · {formatPercentBR(cobertura, 0)}</p>
              <Progress value={cobertura} className="mt-1 h-1.5" />
            </div>

            {anomalia && (
              <div className="mt-3 space-y-1.5">
                {card.quality.filter((q) => q.severity === 'warning').map((q, i) => (
                  <p key={i} className="text-xs text-status-warning"><span className="font-semibold">{q.title}.</span> {q.message}</p>
                ))}
                <Button variant="outline" size="sm" className="mt-1 h-7 text-xs" onClick={() => onReview(card)}>Revisar registro</Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
