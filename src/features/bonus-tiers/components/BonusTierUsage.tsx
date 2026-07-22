import { pluralizeBR } from '@/lib/formatters';
import type { TierUsage } from '../types/bonus-tier.types';

/** Utilização + vínculos reais (funcionários diretos; categorias/bases indiretas). */
export function BonusTierUsage({ usage }: { usage: TierUsage }) {
  if (!usage.emUso) return <span className="text-sm text-muted-foreground">Sem vínculo</span>;
  return (
    <div className="text-sm leading-tight">
      <p className="font-medium text-foreground">{pluralizeBR(usage.funcionarios, 'funcionário', 'funcionários')}</p>
      <p className="text-xs text-muted-foreground">
        {pluralizeBR(usage.categorias, 'categoria', 'categorias')}
        {usage.bases > 0 ? ` · ${pluralizeBR(usage.bases, 'base', 'bases')}` : ''}
      </p>
    </div>
  );
}
