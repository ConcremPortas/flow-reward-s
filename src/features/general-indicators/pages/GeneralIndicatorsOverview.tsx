import { useMemo, useState } from 'react';
import { BarChart3, Gauge } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { GeneralIndicatorsEmptyState } from '../components/GeneralIndicatorsEmptyState';
import { GeneralIndicatorsSummary } from '../components/GeneralIndicatorsSummary';
import { GeneralIndicatorCard } from '../components/GeneralIndicatorCard';
import { GeneralIndicatorsInsights } from '../components/GeneralIndicatorsInsights';
import { GeneralIndicatorEvolutionChart } from '../components/GeneralIndicatorEvolutionChart';
import { GeneralIndicatorSelector } from '../components/GeneralIndicatorSelector';
import { GeneralIndicatorsDataQuality } from '../components/GeneralIndicatorsDataQuality';
import { useGeneralIndicatorInsights } from '../hooks/useGeneralIndicatorInsights';
import { resolveIndicatorDefinition } from '../domain/indicatorDefinitions';
import { seriesForTipo } from '../domain/indicatorCalculations';
import type { GeneralPageProps } from './_shared';

export function GeneralIndicatorsOverview({
  data, competencia, cards, pointsByTipo, selectedTipoId, setSelectedTipoId, onOpenDrawer, onGoToEvolution,
}: GeneralPageProps) {
  const insights = useGeneralIndicatorInsights(cards);
  const [chartTipoId, setChartTipoId] = useState(selectedTipoId || data.tiposAtivos[0]?.id || '');

  const chartTipo = data.tiposAtivos.find((t) => t.id === chartTipoId) ?? data.tiposAtivos[0];
  const chartDef = resolveIndicatorDefinition(chartTipo?.codigo, chartTipo?.nome);
  const chartPoints = useMemo(
    () => (chartTipo ? seriesForTipo(pointsByTipo.get(chartTipo.id) ?? [], competencia, 12).filter((p) => p != null) : []),
    [chartTipo, pointsByTipo, competencia],
  );

  if (data.tiposAtivos.length === 0) {
    return <GeneralIndicatorsEmptyState icon={Gauge} title="Nenhum indicador corporativo cadastrado" description="Cadastre tipos de indicadores gerais para acompanhá-los aqui." />;
  }

  return (
    <div className="space-y-[18px]">
      <GeneralIndicatorsSummary cards={cards} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <GeneralIndicatorCard key={card.tipoId} card={card} onDetail={() => onGoToEvolution(card.tipoId)} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-8">
          <SectionCard
            title="Evolução"
            description="Meta × realizado das últimas competências para o indicador selecionado."
            actions={<GeneralIndicatorSelector tipos={data.tiposAtivos} value={chartTipoId} onChange={setChartTipoId} label="" />}
          >
            <GeneralIndicatorEvolutionChart
              points={chartPoints}
              def={chartDef}
              onSelectCompetencia={() => { setSelectedTipoId(chartTipoId); onGoToEvolution(chartTipoId); }}
            />
          </SectionCard>
        </div>
        <div className="xl:col-span-4">
          <SectionCard title="Leitura do período" description="Apontamentos automáticos.">
            <GeneralIndicatorsInsights insights={insights} onSelectIndicator={onGoToEvolution} />
          </SectionCard>
        </div>
      </div>

      <SectionCard title="Qualidade e cobertura dos dados" description="Sinais de possíveis inconsistências e cobertura das últimas 12 competências." actions={<BarChart3 className="h-4 w-4 text-muted-foreground" />}>
        <GeneralIndicatorsDataQuality cards={cards} onReview={(card) => { if (card.atual) onOpenDrawer({ ...card.atual, descricao: card.descricao, quality: card.quality }); }} />
      </SectionCard>
    </div>
  );
}
