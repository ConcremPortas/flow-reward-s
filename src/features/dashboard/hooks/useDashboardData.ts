import { useEffect, useMemo, useState } from 'react';
import { useFuncionarios, type Funcionario } from '@/hooks/useFuncionarios';
import { useSetores } from '@/hooks/useSetores';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useFaltasAdvertencias, type FaltaAdvertencia } from '@/hooks/useFaltasAdvertencias';
import { useResultadosPremiacao, type ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import { useDSS } from '@/hooks/useDSS';
import { useEPI } from '@/hooks/useEPI';
import { useProducaoSetor } from '@/hooks/useProducaoSetor';
import { useAuth } from '@/contexts/AuthContext';

import type {
  DashboardFilters, ExecutiveMetric, FilterOption, Insight, MetricStatus, WorkforcePoint,
  ViewMode, HealthIndex, SectorRow, ScatterPoint, RewardsIntel, AttentionItem, DataQuality,
} from '../types';
import { METAS, METRIC_TOOLTIPS } from '../metricDefinitions';
import { competenciaLabel, currentCompetencia, lastCompetencias, shiftCompetencia } from '../utils/dates';
import { computeWorkforceEvolution } from '../utils/workforce';
import { absenteismoIndex, totalFaltas } from '../utils/absenteeism';
import { resultadosDaCompetencia, rewardsTotals } from '../utils/rewards';
import { producaoResumo } from '../utils/producao';
import { epiResumo } from '../utils/epi';
import { dssParticipacaoMedia } from '../utils/dss';
import { buildInsights } from '../utils/insights';
import { deltaPct } from '../utils/format';
import { computeHealthIndex } from '../healthIndex';
import { buildSectorMatrix, toScatter } from '../sectorMatrix';
import { buildRewardsIntel } from '../rewardsBreakdown';
import { buildAttention } from '../attention';
import { buildDataQuality } from '../dataQuality';

const DEFAULT_FILTERS: DashboardFilters = {
  competencia: '', unidadeId: 'all', setorId: 'all', gestorId: 'all', compare: 'prev-month',
};

interface Scope { funcs: Funcionario[]; ids: Set<string> | undefined; setorNames: Set<string> | undefined; }

function snapshot(comp: string, scope: Scope, faltas: FaltaAdvertencia[], resultados: ResultadoPremiacao[]) {
  const evo = computeWorkforceEvolution(scope.funcs, comp, 2);
  const point = evo[evo.length - 1];
  const ativos = point?.ativos ?? 0;
  const turnover = point?.turnover ?? 0;
  const absenteismo = absenteismoIndex(totalFaltas(faltas, comp, scope.ids), ativos);
  const premiacao = rewardsTotals(resultadosDaCompetencia(resultados, comp, scope.setorNames)).alcancado;
  return { ativos, turnover, absenteismo, premiacao };
}

const statusMax = (v: number | null, target: number): MetricStatus =>
  v == null ? 'neutral' : v > target * 2 ? 'critical' : v > target ? 'warning' : 'positive';
const statusMin = (v: number | null, target: number): MetricStatus =>
  v == null ? 'neutral' : v >= target ? 'positive' : v >= target - 15 ? 'warning' : 'critical';
const statusGrowth = (d: number | null): MetricStatus => (d == null || d === 0 ? 'info' : d > 0 ? 'positive' : 'warning');
const elegivel = (f: Funcionario) => f.ativo && !!f.base_premiacao_id && !!f.categoria_id && !!f.faixa_id;

export interface DashboardModel {
  loading: boolean;
  refetch: () => void;
  lastUpdated: Date | null;
  filters: DashboardFilters;
  setFilters: (f: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  options: { unidades: FilterOption[]; setores: FilterOption[]; gestores: FilterOption[] };
  executive: ExecutiveMetric[];
  workforce: WorkforcePoint[];
  insights: Insight[];
  health: HealthIndex;
  sectors: SectorRow[];
  scatter: ScatterPoint[];
  rewards: RewardsIntel;
  attention: AttentionItem[];
  dataQuality: DataQuality;
  trends: { labels: string[]; absenteismo: number[]; dss: number[] };
  hasData: boolean;
}

export function useDashboardData(): DashboardModel {
  const { funcionarios, loading: lf, refetch: rf } = useFuncionarios();
  const { setores, loading: ls, refetch: rs } = useSetores();
  const { empresas, loading: le, refetch: re } = useEmpresas();
  const { registros: faltas, loading: lfa, refetch: rfa } = useFaltasAdvertencias();
  const { resultados, loading: lr, refetch: rr } = useResultadosPremiacao();
  const { dssRecords, loading: ld, refetch: rd } = useDSS();
  const { epiRecords, loading: lep, refetch: rep } = useEPI();
  const { registros: producao, loading: lp, refetch: rp } = useProducaoSetor();
  const { profile } = useAuth();

  const loading = lf || ls || le || lfa || lr || ld || lep || lp;

  const [filtersState, setFiltersState] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(profile?.perfil === 'rh' ? 'analitico' : 'executivo');

  useEffect(() => {
    if (filtersState.competencia || loading) return;
    const comps = resultados.map(r => (r.mes_competencia || '').slice(0, 7)).filter(Boolean).sort();
    setFiltersState(prev => ({ ...prev, competencia: comps.length ? comps[comps.length - 1] : currentCompetencia() }));
  }, [loading, resultados, filtersState.competencia]);

  useEffect(() => { if (!loading) setLastUpdated(new Date()); }, [loading]);

  const setFilters = (f: Partial<DashboardFilters>) => setFiltersState(prev => ({ ...prev, ...f }));
  const resetFilters = () => setFiltersState(prev => ({ ...DEFAULT_FILTERS, competencia: prev.competencia }));

  const options = useMemo(() => {
    const unidades: FilterOption[] = empresas.map(e => ({ value: e.id, label: e.nome }));
    const setoresOpts: FilterOption[] = setores
      .filter(s => filtersState.unidadeId === 'all' || s.empresa_id === filtersState.unidadeId)
      .map(s => ({ value: s.id, label: s.nome }));
    const gestorMap = new Map<string, string>();
    setores.forEach(s => {
      if (s.supervisor_id && s.supervisor?.nome) gestorMap.set(s.supervisor_id, s.supervisor.nome);
      if (s.encarregado_id && s.encarregado?.nome) gestorMap.set(s.encarregado_id, s.encarregado.nome);
    });
    const gestores: FilterOption[] = [...gestorMap].map(([value, label]) => ({ value, label }));
    return { unidades, setores: setoresOpts, gestores };
  }, [empresas, setores, filtersState.unidadeId]);

  const model = useMemo(() => {
    const comp = filtersState.competencia || currentCompetencia();
    const compareComp = shiftCompetencia(comp, filtersState.compare === 'prev-year' ? -12 : -1);

    const setoresDoGestor = filtersState.gestorId !== 'all'
      ? setores.filter(s => s.supervisor_id === filtersState.gestorId || s.encarregado_id === filtersState.gestorId)
      : null;
    const setorIdsGestor = setoresDoGestor ? new Set(setoresDoGestor.map(s => s.id)) : null;

    const funcs = funcionarios.filter(f => {
      if (filtersState.unidadeId !== 'all' && f.empresa_id !== filtersState.unidadeId) return false;
      if (filtersState.setorId !== 'all' && f.setor_id !== filtersState.setorId) return false;
      if (setorIdsGestor && !(f.setor_id && setorIdsGestor.has(f.setor_id))) return false;
      return true;
    });

    const anyFilter = filtersState.unidadeId !== 'all' || filtersState.setorId !== 'all' || filtersState.gestorId !== 'all';
    let scopedSetores = setores;
    if (filtersState.unidadeId !== 'all') scopedSetores = scopedSetores.filter(s => s.empresa_id === filtersState.unidadeId);
    if (filtersState.setorId !== 'all') scopedSetores = scopedSetores.filter(s => s.id === filtersState.setorId);
    if (setorIdsGestor) scopedSetores = scopedSetores.filter(s => setorIdsGestor.has(s.id));
    const scopedSetorIds = anyFilter ? new Set(scopedSetores.map(s => s.id)) : undefined;

    const scope: Scope = {
      funcs,
      ids: anyFilter ? new Set(funcs.map(f => f.id)) : undefined,
      setorNames: anyFilter ? new Set(scopedSetores.map(s => s.nome)) : undefined,
    };

    const evolution = computeWorkforceEvolution(funcs, comp, 12);
    const comps12 = lastCompetencias(comp, 12);

    const cur = snapshot(comp, scope, faltas, resultados);
    const prev = snapshot(compareComp, scope, faltas, resultados);

    const dssCur = dssParticipacaoMedia(dssRecords, funcs, comp);
    const dssPrev = dssParticipacaoMedia(dssRecords, funcs, compareComp);
    const prodCur = producaoResumo(producao, comp, scopedSetorIds);
    const prodPrev = producaoResumo(producao, compareComp, scopedSetorIds);
    const epiCur = epiResumo(epiRecords, comp, scope.ids);

    // Trends
    const trendAtivos = evolution.map(p => p.ativos);
    const trendTurnover = evolution.map(p => p.turnover);
    const trendAbsenteismo = comps12.map((c, i) => absenteismoIndex(totalFaltas(faltas, c, scope.ids), evolution[i]?.ativos ?? 0) ?? 0);
    const trendPremiacao = comps12.map(c => rewardsTotals(resultadosDaCompetencia(resultados, c, scope.setorNames)).alcancado);
    const trendDss = comps12.map(c => dssParticipacaoMedia(dssRecords, funcs, c) ?? 0);
    const trendSetoresAbaixo = comps12.map(c => producaoResumo(producao, c, scopedSetorIds).setoresAbaixo);

    const executive: ExecutiveMetric[] = [
      {
        key: 'ativos', title: 'Funcionários ativos', format: 'int', available: true,
        value: cur.ativos, previous: prev.ativos, delta: cur.ativos - prev.ativos, deltaPct: deltaPct(cur.ativos, prev.ativos),
        target: null, status: cur.ativos - prev.ativos < 0 ? 'warning' : 'info', trend: trendAtivos,
        tooltip: METRIC_TOOLTIPS.ativos, betterWhen: 'up',
      },
      {
        key: 'turnover', title: 'Turnover', format: 'pct', available: true,
        value: cur.turnover, previous: prev.turnover, delta: Number((cur.turnover - prev.turnover).toFixed(2)), deltaPct: deltaPct(cur.turnover, prev.turnover),
        target: METAS.turnoverMax, targetKind: 'max', status: statusMax(cur.turnover, METAS.turnoverMax), trend: trendTurnover,
        tooltip: METRIC_TOOLTIPS.turnover, betterWhen: 'down',
      },
      {
        key: 'absenteismo', title: 'Absenteísmo', format: 'pct', available: true,
        value: cur.absenteismo, previous: prev.absenteismo,
        delta: cur.absenteismo != null && prev.absenteismo != null ? Number((cur.absenteismo - prev.absenteismo).toFixed(1)) : null,
        deltaPct: deltaPct(cur.absenteismo, prev.absenteismo),
        target: METAS.absenteismoMax, targetKind: 'max', status: statusMax(cur.absenteismo, METAS.absenteismoMax), trend: trendAbsenteismo,
        tooltip: METRIC_TOOLTIPS.absenteismo, betterWhen: 'down',
      },
      {
        key: 'dss', title: 'Participação DSS', format: 'pct', available: true,
        value: dssCur, previous: dssPrev,
        delta: dssCur != null && dssPrev != null ? Number((dssCur - dssPrev).toFixed(1)) : null, deltaPct: deltaPct(dssCur, dssPrev),
        target: METAS.dssMin, targetKind: 'min', status: statusMin(dssCur, METAS.dssMin), trend: trendDss,
        tooltip: 'Participação média em DSS: participantes ÷ vinculados ao local, média entre eventos do mês.', betterWhen: 'up',
      },
      {
        key: 'setoresAbaixo', title: 'Setores abaixo da meta', format: 'int', available: true,
        value: prodCur.setoresAbaixo, previous: prodPrev.setoresAbaixo, delta: prodCur.setoresAbaixo - prodPrev.setoresAbaixo, deltaPct: null,
        target: 0, targetKind: 'max',
        status: prodCur.setoresAbaixo === 0 ? 'positive' : prodCur.setoresAbaixo <= 2 ? 'warning' : 'critical', trend: trendSetoresAbaixo,
        tooltip: 'Setores com atingimento de produção < 100% na competência.', betterWhen: 'down',
      },
      {
        key: 'premiacao', title: 'Premiação projetada', format: 'currency', available: true,
        value: cur.premiacao, previous: prev.premiacao, delta: cur.premiacao - prev.premiacao, deltaPct: deltaPct(cur.premiacao, prev.premiacao),
        target: null, status: statusGrowth(cur.premiacao - prev.premiacao), trend: trendPremiacao,
        tooltip: METRIC_TOOLTIPS.premiacao, betterWhen: 'up',
      },
    ];

    // Elegibilidade global (para o health index)
    const ativosScope = funcs.filter(f => f.ativo);
    const elegPct = ativosScope.length > 0 ? (ativosScope.filter(elegivel).length / ativosScope.length) * 100 : null;

    const health = computeHealthIndex({
      absenteismo: cur.absenteismo, turnover: cur.turnover, dssPart: dssCur,
      epiAbertas: epiCur.abertas, producaoGlobal: prodCur.atingimentoGlobal, elegibilidadePct: elegPct,
    });

    const sectors = buildSectorMatrix(
      { setores, funcionarios, faltas, dss: dssRecords, epi: epiRecords, producao, resultados },
      comp, scopedSetorIds,
    );
    const scatter = toScatter(sectors);
    const rewards = buildRewardsIntel(resultados, comp, funcs, scope.setorNames);
    const attention = buildAttention(sectors);
    const dataQuality = buildDataQuality();

    const lastPt = evolution[evolution.length - 1];
    const prevPt = evolution[evolution.length - 2];
    const insights = buildInsights({
      headcountDelta: cur.ativos - prev.ativos,
      desligamentos: lastPt?.desligamentos ?? 0, desligamentosPrev: prevPt?.desligamentos ?? 0,
      turnover: cur.turnover, absenteismo: cur.absenteismo, absenteismoPrev: prev.absenteismo,
      premiacao: cur.premiacao, premiacaoDeltaPct: deltaPct(cur.premiacao, prev.premiacao),
      producaoGlobal: prodCur.atingimentoGlobal, setoresAbaixo: prodCur.setoresAbaixo,
      epiAbertas: epiCur.abertas, dssPart: dssCur,
    });

    const trends = { labels: comps12.map(competenciaLabel), absenteismo: trendAbsenteismo, dss: trendDss };

    const hasData = funcionarios.length > 0 || resultados.length > 0;
    return { executive, workforce: evolution, insights, health, sectors, scatter, rewards, attention, dataQuality, trends, hasData };
  }, [funcionarios, setores, faltas, resultados, producao, epiRecords, dssRecords, filtersState]);

  const refetch = () => { rf(); rs(); re(); rfa(); rr(); rd(); rep(); rp(); };

  return {
    loading, refetch, lastUpdated,
    filters: filtersState, setFilters, resetFilters,
    viewMode, setViewMode,
    options,
    ...model,
  };
}
