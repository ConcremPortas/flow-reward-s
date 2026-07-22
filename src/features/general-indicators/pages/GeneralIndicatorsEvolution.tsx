import { useMemo } from 'react';
import { TrendingUp } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { CompetenciaPicker } from '@/components/dashboard/CompetenciaPicker';
import { Button } from '@/components/ui/button';
import { formatPercentBR } from '@/lib/formatters';
import { competenciaLabelLong, competenciaLabel, shiftCompetencia } from '@/features/dashboard/utils/dates';
import { GeneralIndicatorsEmptyState } from '../components/GeneralIndicatorsEmptyState';
import { GeneralIndicatorSelector } from '../components/GeneralIndicatorSelector';
import { GeneralIndicatorEvolutionChart } from '../components/GeneralIndicatorEvolutionChart';
import { GeneralIndicatorDeviationChart } from '../components/GeneralIndicatorDeviationChart';
import { GeneralIndicatorComparison } from '../components/GeneralIndicatorComparison';
import { useGeneralIndicatorComparison } from '../hooks/useGeneralIndicatorComparison';
import { resolveIndicatorDefinition } from '../domain/indicatorDefinitions';
import { seriesForTipo } from '../domain/indicatorCalculations';
import { formatIndicatorValue, formatIndicatorDeviation } from '../domain/indicatorFormatting';
import type { GeneralPageProps } from './_shared';

export function GeneralIndicatorsEvolution({
  data, competencia, pointsByTipo, selectedTipoId, setSelectedTipoId, comparacaoCompetencia, setComparacaoCompetencia,
}: GeneralPageProps) {
  const tipoId = selectedTipoId || data.tiposAtivos[0]?.id || '';
  const tipo = data.tiposAtivos.find((t) => t.id === tipoId);
  const def = resolveIndicatorDefinition(tipo?.codigo, tipo?.nome);

  const windowPoints = useMemo(
    () => seriesForTipo(pointsByTipo.get(tipoId) ?? [], competencia, 12).filter((p) => p != null),
    [pointsByTipo, tipoId, competencia],
  );
  const atual = windowPoints.find((p) => p.competencia === competencia) ?? null;
  const acumulado = windowPoints.reduce((s, p) => s + (p.realizado ?? 0), 0);
  const comAting = windowPoints.filter((p) => p.atingimento != null);
  const melhor = comAting.length ? comAting.reduce((a, b) => (b.atingimento! > a.atingimento! ? b : a)) : null;
  const pior = comAting.length ? comAting.reduce((a, b) => (b.atingimento! < a.atingimento! ? b : a)) : null;

  const comparison = useGeneralIndicatorComparison(data.tiposAtivos, pointsByTipo, competencia, comparacaoCompetencia);

  if (data.tiposAtivos.length === 0) {
    return <GeneralIndicatorsEmptyState icon={TrendingUp} title="Nenhum indicador corporativo cadastrado" />;
  }

  return (
    <div className="space-y-[18px]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <GeneralIndicatorSelector tipos={data.tiposAtivos} value={tipoId} onChange={setSelectedTipoId} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-7">
        <StatCard title="Realizado atual" value={formatIndicatorValue(atual?.realizado, def, { compact: true })} icon={TrendingUp} />
        <StatCard title="Meta atual" value={formatIndicatorValue(atual?.meta, def, { compact: true })} />
        <StatCard title="Desvio" value={formatIndicatorDeviation(atual?.desvio ?? null, def, { compact: true })}
          status={atual?.desvio == null ? 'neutral' : atual.desvio >= 0 ? 'positive' : 'critical'} />
        <StatCard title="Atingimento" value={atual?.atingimento != null ? formatPercentBR(atual.atingimento, 1) : '—'}
          status={atual?.atingimento == null ? 'neutral' : atual.atingimento >= 100 ? 'positive' : atual.atingimento >= 90 ? 'warning' : 'critical'} />
        <StatCard title="Acumulado (12m)" value={formatIndicatorValue(acumulado, def, { compact: true })} hint="soma do realizado" />
        <StatCard title="Melhor competência" value={melhor ? competenciaLabel(melhor.competencia) : '—'} hint={melhor?.atingimento != null ? formatPercentBR(melhor.atingimento, 1) : ''} status="positive" />
        <StatCard title="Pior competência" value={pior ? competenciaLabel(pior.competencia) : '—'} hint={pior?.atingimento != null ? formatPercentBR(pior.atingimento, 1) : ''} status={pior ? 'critical' : 'neutral'} />
      </div>

      <SectionCard title={`Meta × Realizado — ${tipo?.nome ?? ''}`} description="Até 12 competências. Indicadores de unidades diferentes não são comparados no mesmo eixo.">
        <GeneralIndicatorEvolutionChart points={windowPoints} def={def} />
      </SectionCard>

      <SectionCard title="Desvio da meta" description="Realizado − meta por competência.">
        <GeneralIndicatorDeviationChart points={windowPoints} def={def} />
      </SectionCard>

      <SectionCard
        title="Comparação entre competências"
        description={`${competenciaLabelLong(comparacaoCompetencia)} → ${competenciaLabelLong(competencia)}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-8" onClick={() => setComparacaoCompetencia(shiftCompetencia(competencia, -1))}>Mês anterior</Button>
            <CompetenciaPicker value={comparacaoCompetencia} onChange={setComparacaoCompetencia} className="w-[160px]" />
          </div>
        }
      >
        <GeneralIndicatorComparison rows={comparison} />
      </SectionCard>
    </div>
  );
}
