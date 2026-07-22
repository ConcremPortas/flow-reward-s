import type { LucideIcon } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import type { MetricStatus } from '@/features/dashboard/types';
import { type Avail, hasValue, countLabel, moneyLabel, percentLabel } from '../domain/dataAvailability';

type Formato = 'contagem' | 'moeda' | 'percentual';

const formatar = (a: Avail<number>, formato: Formato): string => {
  if (formato === 'moeda') return moneyLabel(a);
  if (formato === 'percentual') return percentLabel(a);
  return countLabel(a);
};

interface Props {
  title: string;
  avail: Avail<number>;
  formato?: Formato;
  hint?: string;
  icon?: LucideIcon;
  /** status quando há valor real; ausências ficam neutras automaticamente. */
  status?: MetricStatus;
  onClick?: () => void;
}

/**
 * KPI que respeita o modelo de disponibilidade: valores reais são formatados;
 * ausências (não informado / restrito / indisponível / erro) aparecem com o
 * rótulo apropriado e status neutro — jamais um zero fictício.
 */
export function AvailStat({ title, avail, formato = 'contagem', hint, icon, status, onClick }: Props) {
  const presente = hasValue(avail);
  const valor = formatar(avail, formato);
  return (
    <StatCard
      title={title}
      value={valor}
      hint={hint}
      icon={icon}
      status={presente ? status : 'neutral'}
      onClick={onClick}
    />
  );
}
