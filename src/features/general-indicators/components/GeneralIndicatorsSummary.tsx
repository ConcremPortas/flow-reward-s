import { LayoutList, Target, AlertTriangle, TrendingDown, ShieldAlert } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { hasAnomaly } from '../domain/indicatorDataQuality';
import type { GeneralIndicatorCardData } from '../types/general-indicators.types';

/**
 * Resumo da competência — apenas contagens reais. NÃO exibe "média geral de
 * atingimento": não há regra de negócio validada para combinar indicadores de
 * unidades diferentes (ex.: faturamento em R$ com kits em unidades).
 */
export function GeneralIndicatorsSummary({ cards }: { cards: GeneralIndicatorCardData[] }) {
  const comDado = cards.filter((c) => c.atual);
  const metaAtingida = comDado.filter((c) => c.atual!.situacao === 'superada' || c.atual!.situacao === 'atingida').length;
  const atencao = comDado.filter((c) => c.atual!.situacao === 'atencao').length;
  const abaixo = comDado.filter((c) => c.atual!.situacao === 'abaixo').length;
  const inconsistencias = cards.filter((c) => hasAnomaly(c.quality)).length;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
      <StatCard title="Acompanhados" value={String(cards.length)} hint="indicadores" icon={LayoutList} />
      <StatCard title="Meta atingida" value={String(metaAtingida)} icon={Target} status="positive" />
      <StatCard title="Em atenção" value={String(atencao)} icon={AlertTriangle} status={atencao > 0 ? 'warning' : 'positive'} />
      <StatCard title="Abaixo da meta" value={String(abaixo)} icon={TrendingDown} status={abaixo > 0 ? 'critical' : 'positive'} />
      <StatCard title="Possíveis inconsistências" value={String(inconsistencias)} icon={ShieldAlert} status={inconsistencias > 0 ? 'warning' : 'positive'} />
    </div>
  );
}
