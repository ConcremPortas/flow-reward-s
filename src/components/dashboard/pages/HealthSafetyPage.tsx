import { Activity, ShieldCheck, HardHat } from 'lucide-react';
import { fmtPct } from '@/features/dashboard/utils/format';
import { METAS } from '@/features/dashboard/metricDefinitions';
import { StatCard } from '../StatCard';
import { UnavailableMetric } from '../UnavailableMetric';
import { AbsenteeismAnalytics } from '../AbsenteeismAnalytics';
import { SafetyCompliance } from '../SafetyCompliance';
import { DataQualityPanel } from '../DataQualityPanel';
import type { PageProps } from './_shared';

/** Página 3 — Absenteísmo, Saúde e Segurança. */
export function HealthSafetyPage({ dash }: PageProps) {
  const abs = dash.executive.find((m) => m.key === 'absenteismo');
  const comDss = dash.sectors.filter((s) => s.dssPct != null);
  const dssMedia = comDss.length ? comDss.reduce((a, s) => a + (s.dssPct as number), 0) / comDss.length : null;
  const epiTotal = dash.sectors.reduce((a, s) => a + s.epiPendencias, 0);

  return (
    <div className="space-y-[18px]">
      <div className="grid grid-cols-2 items-stretch gap-[18px] md:grid-cols-3 min-[1400px]:grid-cols-5">
        <StatCard title="Absenteísmo" value={abs?.value != null ? fmtPct(abs.value) : '—'} hint={`meta ≤ ${METAS.absenteismoMax}`} icon={Activity} status={abs?.status} />
        <UnavailableMetric title="Dias perdidos" reason="Sem fonte: depende de afastamentos/horas — não registrados no banco." />
        <StatCard title="Participação DSS" value={dssMedia == null ? '—' : fmtPct(dssMedia, 0)} hint={`meta ≥ ${METAS.dssMin}%`} icon={ShieldCheck} status={dssMedia == null ? 'neutral' : dssMedia >= METAS.dssMin ? 'positive' : 'warning'} />
        <StatCard title="Pendências de EPI" value={String(epiTotal)} hint="não conformidades" icon={HardHat} status={epiTotal === 0 ? 'positive' : epiTotal <= 2 ? 'warning' : 'critical'} />
        <UnavailableMetric title="Afastamentos" reason="Sem tabela de afastamentos (INSS/atestados) — requer módulo SESMT/RH." />
      </div>

      <AbsenteeismAnalytics trends={dash.trends} sectors={dash.sectors} />
      <SafetyCompliance sectors={dash.sectors} />
      <DataQualityPanel quality={dash.dataQuality} lastUpdated={dash.lastUpdated} />
    </div>
  );
}
