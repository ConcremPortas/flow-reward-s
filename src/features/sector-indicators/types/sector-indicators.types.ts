// Tipos da Central Operacional de Apuração dos Indicadores por Setor. Só contratos.
//
// Nota de auditoria (persistência): cada linha de `concremrh_indicadores_setor`
// tem UM registro por setor+competência com 15 colunas — para cada um dos cinco
// indicadores há `<id>_meta`, `<id>_realizado` e `<id>_percentual`. A competência
// é persistida na coluna `competencia` (texto) SEMPRE como o primeiro dia do mês
// ('YYYY-MM-01') — é o formato que o motor de premiação compara
// (GerarPremiacoes.tsx: `i.competencia === '${ano}-${mes}-01'`). Nesta feature a
// competência circula como 'YYYY-MM' e só é convertida na fronteira de
// persistência (nunca sofre conversão de timezone).
//
// O `<id>_percentual` é persistido como FRAÇÃO (realizado/meta, ex.: 0,98) apenas
// para exibição/denormalização — o motor de premiação NÃO lê essa coluna, ele
// recalcula a partir de meta/realizado. Aqui também derivamos o percentual de
// meta/realizado; a coluna é reescrita no salvamento para manter o dado coerente.

/** Os cinco indicadores fixos de setor (colunas da tabela). */
export type IndicatorId =
  | 'hora_maquina'
  | 'identificacao_nc'
  | 'limpeza'
  | 'tratamento_nc'
  | 'operacao_segura';

/** Par editável meta/realizado de um indicador. */
export interface IndicatorPair {
  meta: number | null;
  realizado: number | null;
}

/** Valores editáveis de um setor na competência — os cinco pares. */
export type SectorIndicatorEntry = Record<IndicatorId, IndicatorPair>;

/** Mapa {setorId: SectorIndicatorEntry} usado como baseline/draft da apuração. */
export type SectorIndicatorDraftMap = Record<string, SectorIndicatorEntry>;

/** Situação consolidada de um setor na competência. */
export type IndicatorSituacao = 'superada' | 'proxima' | 'abaixo' | 'pendente' | 'sem_medicao';

/** Estado semântico de uma célula (indicador) da matriz — dirige o heatmap. */
export type CellState = 'atingido' | 'atencao' | 'abaixo' | 'sem_medicao' | 'pendente';

/** Célula da matriz — um indicador de um setor, já com percentual/estado derivados. */
export interface IndicatorCell {
  indicatorId: IndicatorId;
  meta: number | null;
  realizado: number | null;
  percentual: number | null; // realizado/meta*100 — escala 0-100; null = não calculável
  desvio: number | null;      // realizado - meta — null quando ausente
  state: CellState;
  // Comparação com a competência anterior (preenchido só quando ativa)
  percentualAnterior?: number | null;
  variacaoPP?: number | null; // pontos percentuais (percentual atual - anterior)
}

/** Linha da matriz de apuração — setor + cinco células + consolidação. */
export interface SectorIndicatorRow {
  setorId: string;
  setorNome: string;
  empresaId: string | null;
  empresaNome: string | null;
  cells: Record<IndicatorId, IndicatorCell>;
  media: number | null;   // média de exibição dos percentuais disponíveis (não ponderada)
  situacao: IndicatorSituacao;
  registroId: string | null; // id em concremrh_indicadores_setor; null = pendente
  temRegistro: boolean;
  temDados: boolean;
  semMedicao: boolean;
  /** Pior indicador (menor percentual) — todos os indicadores são "maior = melhor". */
  piorIndicador: { indicatorId: IndicatorId; percentual: number } | null;
}

/** Linha do histórico (um registro salvo, com competência). */
export interface SectorIndicatorHistoryRow extends SectorIndicatorRow {
  competencia: string; // 'YYYY-MM'
}

export interface SectorIndicatorFilters {
  search: string;
  empresaId: string;
  setorId: string;
  situacao: 'todos' | IndicatorSituacao;
  somentePendentes: boolean;
  somenteAlterados: boolean;
  semMedicao: boolean;
}

export const DEFAULT_INDICATOR_FILTERS: SectorIndicatorFilters = {
  search: '',
  empresaId: 'todos',
  setorId: 'todos',
  situacao: 'todos',
  somentePendentes: false,
  somenteAlterados: false,
  semMedicao: false,
};

export interface SectorIndicatorHistoryFilters {
  search: string;
  competenciaInicial: string;
  competenciaFinal: string;
  empresaId: string;
  setorId: string;
  situacao: 'todos' | IndicatorSituacao;
  indicatorId: 'todos' | IndicatorId;
}

export const DEFAULT_INDICATOR_HISTORY_FILTERS: SectorIndicatorHistoryFilters = {
  search: '',
  competenciaInicial: '',
  competenciaFinal: '',
  empresaId: 'todos',
  setorId: 'todos',
  situacao: 'todos',
  indicatorId: 'todos',
};

/** Campos persistidos de um registro (5 indicadores × meta/realizado/percentual). */
export interface IndicatorPersistFields {
  hora_maquina_meta: number | null;
  hora_maquina_realizado: number | null;
  hora_maquina_percentual: number | null;
  identificacao_nc_meta: number | null;
  identificacao_nc_realizado: number | null;
  identificacao_nc_percentual: number | null;
  limpeza_meta: number | null;
  limpeza_realizado: number | null;
  limpeza_percentual: number | null;
  tratamento_nc_meta: number | null;
  tratamento_nc_realizado: number | null;
  tratamento_nc_percentual: number | null;
  operacao_segura_meta: number | null;
  operacao_segura_realizado: number | null;
  operacao_segura_percentual: number | null;
}
