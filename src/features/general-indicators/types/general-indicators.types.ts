// Tipos da Central de Indicadores Corporativos. Só contratos.
//
// Nota de auditoria (persistência): `concremrh_indicadores_gerais` tem UMA linha
// por tipo_indicador+competência (UNIQUE INDEX (tipo_indicador_id, competencia)).
// A competência é persistida como 'YYYY-MM-01' (o motor de premiação compara a
// string exata: `i.competencia === '${ano}-${mes}-01'`) e nesta feature circula
// como 'YYYY-MM'. O `percentual` é PERSISTIDO como inteiro
// (`Math.round(realizado/meta*100)`) e é CONSUMIDO pela premiação no caso do
// Faturamento (`notaFaturamento = percentual/100`). Não alteramos essa gravação;
// para exibição/gráficos usamos um percentual preciso derivado de meta/realizado.

export type IndicatorFormat = 'currency' | 'integer' | 'decimal' | 'percent' | 'quantity';
export type IndicatorDirection = 'higher_is_better' | 'lower_is_better';

/** Situação de negócio de um registro (não confundir com qualidade do dado). */
export type GeneralSituacao = 'superada' | 'atingida' | 'atencao' | 'abaixo' | 'sem_dados';

/** Sinal de qualidade de dado (anomalia). NÃO é status de negócio. */
export interface DataQualitySignal {
  severity: 'warning' | 'info';
  code: 'meta_zero' | 'sem_realizado' | 'sem_meta' | 'scale_change' | 'placeholder_um' | 'outlier';
  title: string;
  message: string;
  currentValue?: number | null;
  referenceValue?: number | null;
}

/** Um registro derivado (com métricas de exibição já calculadas). */
export interface GeneralIndicatorPoint {
  registroId: string;
  tipoId: string;
  codigo: string;
  nome: string;
  competencia: string;          // 'YYYY-MM'
  meta: number | null;
  realizado: number | null;
  /** Atingimento de exibição (direção-aware), escala 0-100. Null se não calculável. */
  atingimento: number | null;
  /** Percentual inteiro efetivamente armazenado (consumido pela premiação). */
  percentualArmazenado: number | null;
  desvio: number | null;        // realizado - meta
  situacao: GeneralSituacao;
}

/** Insight determinístico de leitura gerencial. */
export interface GeneralInsight {
  code: string;
  type: 'positivo' | 'negativo' | 'atencao' | 'informativo';
  severity: 'alta' | 'media' | 'baixa';
  indicatorCode: string;
  indicatorLabel: string;
  competencia: string;
  title: string;
  message: string;
  value: number | null;
  /** Indicador a aprofundar ao clicar (abre Evolução). */
  actionTipoId: string;
}

/** Dados agregados de um indicador para o card executivo. */
export interface GeneralIndicatorCardData {
  tipoId: string;
  codigo: string;
  nome: string;
  descricao?: string;
  atual: GeneralIndicatorPoint | null;
  anterior: GeneralIndicatorPoint | null;
  serie: GeneralIndicatorPoint[];       // até 12 competências (mais antiga → recente)
  variacaoRealizado: number | null;     // % vs. competência anterior
  variacaoPP: number | null;            // pontos percentuais de atingimento
  tendencia: 'up' | 'down' | 'flat' | null;
  quality: DataQualitySignal[];
}

export interface GeneralIndicatorFilters {
  search: string;
  tipoId: string;                       // 'todos' | tipoId
  competenciaInicial: string;
  competenciaFinal: string;
  situacao: 'todos' | GeneralSituacao;
  somenteInconsistencias: boolean;
}

export const DEFAULT_GENERAL_FILTERS: GeneralIndicatorFilters = {
  search: '',
  tipoId: 'todos',
  competenciaInicial: '',
  competenciaFinal: '',
  situacao: 'todos',
  somenteInconsistencias: false,
};

/** Linha do histórico — um registro + qualidade de dado. */
export interface GeneralHistoryRow extends GeneralIndicatorPoint {
  descricao?: string;
  quality: DataQualitySignal[];
}
