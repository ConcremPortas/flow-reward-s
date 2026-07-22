import { Users, ShieldCheck, ShieldAlert, Percent } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';

interface Props {
  auditados: number;
  conformes: number;
  naoConformes: number;
  taxaConformidade: number;
}

/**
 * Resumo em tempo real da Inspeção. Sem contador de "pendentes": a tela não
 * possui um estado real de "não auditado" — todo funcionário já nasce
 * conforme por padrão (regra preservada), então não há uma terceira situação
 * a exibir sem inventar semântica que a persistência não suporta.
 */
export function EpiInspectionSummary({ auditados, conformes, naoConformes, taxaConformidade }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <StatCard title="Auditados" value={String(auditados)} hint="funcionários" icon={Users} />
      <StatCard title="Conformes" value={String(conformes)} hint="marcados" icon={ShieldCheck} status="positive" />
      <StatCard title="Não conformes" value={String(naoConformes)} hint="marcados" icon={ShieldAlert} status={naoConformes > 0 ? 'warning' : 'positive'} />
      <StatCard title="Taxa de conformidade" value={`${taxaConformidade.toFixed(0)}%`} hint="do total auditado" icon={Percent} status={taxaConformidade >= 90 ? 'positive' : taxaConformidade >= 70 ? 'warning' : 'critical'} />
    </div>
  );
}
