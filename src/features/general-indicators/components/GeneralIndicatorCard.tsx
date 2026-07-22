import { TrendingUp, TrendingDown, Minus, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatPercentBR, formatNumberBR } from '@/lib/formatters';
import { competenciaShortLabelBR } from '../domain/indicatorCalculations';
import { resolveIndicatorDefinition } from '../domain/indicatorDefinitions';
import { formatIndicatorValue, formatIndicatorDeviation } from '../domain/indicatorFormatting';
import { GeneralIndicatorStatusBadge } from './GeneralIndicatorStatusBadge';
import { GeneralIndicatorQualityBadge } from './GeneralIndicatorQualityBadge';
import type { GeneralIndicatorCardData } from '../types/general-indicators.types';

interface Props {
  card: GeneralIndicatorCardData;
  onDetail: () => void;
}

/** Card executivo de um indicador — número grande, sparkline e leitura rápida. */
export function GeneralIndicatorCard({ card, onDetail }: Props) {
  const def = resolveIndicatorDefinition(card.codigo, card.nome);
  const atual = card.atual;
  const spark = card.serie.filter((p) => p.realizado != null).map((p) => ({ c: competenciaShortLabelBR(p.competencia), realizado: p.realizado }));
  const trendColor = card.tendencia === 'up' ? 'text-success' : card.tendencia === 'down' ? 'text-destructive' : 'text-muted-foreground';
  const TrendIcon = card.tendencia === 'up' ? TrendingUp : card.tendencia === 'down' ? TrendingDown : Minus;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">{card.nome}</p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{card.codigo}</p>
        </div>
        {atual ? <GeneralIndicatorStatusBadge situacao={atual.situacao} /> : <GeneralIndicatorStatusBadge situacao="sem_dados" />}
      </div>

      {atual ? (
        <>
          <div className="mt-3 flex items-end justify-between gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="min-w-0 cursor-default">
                  <p className="truncate text-[1.7rem] font-bold leading-none tracking-tight text-foreground">
                    {formatIndicatorValue(atual.realizado, def, { compact: true })}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Meta {formatIndicatorValue(atual.meta, def, { compact: true })}
                  </p>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Realizado: {formatIndicatorValue(atual.realizado, def)}</p>
                <p>Meta: {formatIndicatorValue(atual.meta, def)}</p>
              </TooltipContent>
            </Tooltip>

            {spark.length >= 2 && (
              <div className="h-10 w-24 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={spark} margin={{ top: 4, right: 2, bottom: 0, left: 2 }}>
                    <YAxis hide domain={['dataMin', 'dataMax']} />
                    <Line type="monotone" dataKey="realizado" stroke="hsl(var(--primary))" strokeWidth={1.75} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/50 pt-3 text-xs">
            <div>
              <p className="text-muted-foreground">Atingimento</p>
              <p className="font-semibold tabular-nums text-foreground">{atual.atingimento != null ? formatPercentBR(atual.atingimento, 1) : '—'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Desvio</p>
              <p className={cn('font-semibold tabular-nums', atual.desvio != null && atual.desvio < 0 ? 'text-destructive' : 'text-foreground')}>
                {formatIndicatorDeviation(atual.desvio, def, { compact: true })}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">vs. anterior</p>
              <p className={cn('flex items-center gap-1 font-semibold tabular-nums', trendColor)}>
                <TrendIcon className="h-3.5 w-3.5" />
                {card.variacaoRealizado != null ? `${card.variacaoRealizado >= 0 ? '+' : ''}${formatNumberBR(card.variacaoRealizado, 1)}%` : '—'}
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <GeneralIndicatorQualityBadge signals={card.quality} />
            <Button variant="ghost" size="sm" className="ml-auto h-7 gap-1 text-xs" onClick={onDetail}>
              Detalhar <ArrowUpRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </>
      ) : (
        <div className="mt-3 flex flex-1 flex-col items-start justify-center">
          <p className="text-sm text-muted-foreground">Sem registro nesta competência.</p>
          <Button variant="ghost" size="sm" className="mt-2 h-7 gap-1 text-xs" onClick={onDetail}>
            Ver evolução <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}
