// Tipos da Central Analítica de RH. Só dados/contratos — sem lógica.

export type MetricStatus = 'critical' | 'warning' | 'positive' | 'info' | 'neutral';
export type CompareMode = 'prev-month' | 'prev-year';
export type RiskLevel = 'baixo' | 'medio' | 'alto';
export type MetricFormat = 'int' | 'pct' | 'currency';

/** Filtros globais que controlam toda a tela. */
export interface DashboardFilters {
  competencia: string;   // 'YYYY-MM'
  unidadeId: string;     // empresa id | 'all'
  setorId: string;       // setor id | 'all'
  gestorId: string;      // funcionário id (supervisor/encarregado) | 'all'
  compare: CompareMode;
}

/** Opções disponíveis para os selects de filtro. */
export interface FilterOption {
  value: string;
  label: string;
}

/** Card do Resumo Executivo. */
export interface ExecutiveMetric {
  key: string;
  title: string;
  format: MetricFormat;
  /** false => renderiza estado "Dado indisponível" (sem número fictício). */
  available: boolean;
  unavailableReason?: string;
  value: number | null;
  previous: number | null;
  delta: number | null;      // absoluto (value - previous)
  deltaPct: number | null;   // percentual
  target: number | null;
  targetKind?: 'max' | 'min';
  status: MetricStatus;
  trend: number[];           // série curta para o mini-gráfico
  tooltip: string;           // explica o cálculo
  betterWhen: 'up' | 'down';
}

/** Ponto da evolução do quadro (mês a mês). */
export interface WorkforcePoint {
  competencia: string;   // 'YYYY-MM'
  label: string;         // 'jul/25'
  ativos: number;
  admissoes: number;
  desligamentos: number;
  saldo: number;
  turnover: number;      // %
}

/** Entrada para o cálculo de risco de um setor (regras centralizadas). */
export interface SectorRiskInput {
  producaoPct: number | null;
  absenteismo: number | null;
  dssPct: number | null;
  epiPendencias: number;
}

export interface SectorRiskResult {
  level: RiskLevel;
  score: number;
  reasons: string[];
}

/** Linha da matriz de performance por setor. */
export interface SectorRow {
  setorId: string;
  setor: string;
  unidade: string | null;
  gestor: string | null;
  headcount: number;
  producaoPct: number | null;
  absenteismo: number | null;
  dssPct: number | null;
  epiPendencias: number;
  horasExtras: number | null;   // sempre null (sem fonte)
  premiacaoMedia: number | null;
  elegibilidadePct: number | null;
  advertencias: number;
  risco: SectorRiskResult;
}

/** Insight gerencial gerado a partir dos dados. */
export interface Insight {
  id: string;
  severity: MetricStatus;
  title: string;
  detail: string;
  module?: string;   // rota para aprofundar
}

/** Item da Central de Atenção. */
export interface AttentionItem {
  id: string;
  severity: MetricStatus;
  situacao: string;
  setor: string | null;
  impacto: string;
  responsavel: string | null;
  prazo: string | null;
  module: string;
}

export type ViewMode = 'executivo' | 'analitico';

/** Componente do Índice de Saúde do RH. */
export interface HealthComponent {
  key: string;
  label: string;
  score: number;        // 0..100
  weight: number;       // peso efetivo (após redistribuição)
  available: boolean;
  detail: string;
}

export interface HealthIndex {
  score: number;        // 0..100
  partial: boolean;     // algum componente sem dados
  status: MetricStatus;
  components: HealthComponent[];
}

/** Ponto do gráfico Pessoas × Resultado. */
export interface ScatterPoint {
  setorId: string;
  setor: string;
  headcount: number;      // eixo X
  producaoPct: number;    // eixo Y
  premiacaoMedia: number; // tamanho
  risco: RiskLevel;
  absenteismo: number | null;
  dssPct: number | null;
  epiPendencias: number;
}

/** Inteligência de premiações. */
export interface RewardsFaixa { faixa: string; count: number; total: number; }
export interface RewardsRankItem { setor: string; total: number; count: number; }
export interface WaterfallStep { key: string; label: string; value: number; kind: 'base' | 'loss' | 'result'; }
export interface RewardsSimulation { key: string; label: string; recuperavel: number; }

export interface RewardsIntel {
  potencial: number;
  projetado: number;
  aprovado: number | null;    // sem fonte de aprovação
  medio: number;
  elegiveis: number;
  naoElegiveis: number;
  faixas: RewardsFaixa[];
  ranking: RewardsRankItem[];
  waterfall: WaterfallStep[];
  perdaPorCriterio: { criterio: string; valor: number }[];
  simulacoes: RewardsSimulation[];
}

/** Qualidade e cobertura de dados. */
export type DataStatus = 'disponivel' | 'calculavel' | 'parcial' | 'indisponivel';
export interface DataSource {
  key: string;
  label: string;
  status: DataStatus;
  detail: string;
}
export interface DataQuality {
  sources: DataSource[];
  coberturaPct: number;   // % de métricas com fonte
}
