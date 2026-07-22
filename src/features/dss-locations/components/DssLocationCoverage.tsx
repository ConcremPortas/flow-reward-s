import { formatNumberBR, pluralizeBR } from '@/lib/formatters';
import type { DssLocationUsage } from '../types/dss-location.types';

/** Célula compacta de cobertura (funcionários + ativos). */
export function DssLocationCoverage({ usage }: { usage: DssLocationUsage }) {
  if (usage.funcionarios === 0) return <span className="text-sm text-muted-foreground">Nenhum funcionário</span>;
  return (
    <div className="text-sm leading-tight">
      <span className="text-foreground">{pluralizeBR(usage.funcionarios, 'funcionário', 'funcionários')}</span>
      <span className="block text-xs text-muted-foreground">{formatNumberBR(usage.funcionariosAtivos)} ativos</span>
    </div>
  );
}
