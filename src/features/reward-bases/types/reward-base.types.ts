// Tipos da Central de Bases de Premiação. Só contratos.
//
// Auditoria: entidade `BasePremiacao` (tabela `concremrh_base_premiacao`).
// Campos persistidos: id, nome, descricao?, valor_base (number), tipo (string|null:
// 'percentual' | 'valor_fixo'), ativo, created_at, updated_at. Form legado edita
// nome/tipo/valor_base/descricao. Exclusão é SOFT (ativo=false). Sem constraint de
// unicidade de nome no banco (duplicidade só na app).
//
// CRÍTICO — uso no motor: o motor deriva o comportamento do NOME da base, não dos
// campos `tipo`/`valor_base`:
//   - isKitsBase   = normalize(nome).startsWith('KIT')
//   - isProducaoBase = normalize(nome).includes('PRODUCAO')
//   - extractKitsMultiplier = /(\d+)%/ no nome → multiplicador (ex.: "KIT 200%" → 2.0)
//   - bonusBase (kits) = valorKits × multiplicador
// Portanto `valor_base` e `tipo` são DECORATIVOS/legados para o cálculo — o
// parâmetro financeiro real dos kits é o percentual embutido no NOME. Renomear uma
// base pode alterar o motor. NÃO renomear/alterar regras aqui.
//
// Relações reais (FK direta → concremrh_base_premiacao):
//   - funcionarios.base_premiacao_id   (direto)
//   - formulas_calculo.base_premiacao_id (direto)
//   - resultados_premiacao.base_premiacao_id (histórico — snapshot dos valores)
// Categorias: indireto (via funcionários/fórmulas). Configuração de kits: GLOBAL
// (sem FK — vigência por data). Faixas: nenhuma relação.

export type RewardBaseTipo = 'percentual' | 'valor_fixo';

/** Comportamento derivado do NOME (espelha o motor — só observacional). */
export type EngineBehavior = 'kits' | 'producao' | 'outra';

export interface EngineBehaviorInfo {
  behavior: EngineBehavior;
  /** Multiplicador de kits derivado do nome (1.0 se não houver %). */
  multiplicador: number;
  label: string;
}

export type NameAnalysisState = 'sem_percentual' | 'igual' | 'diferente' | 'nao_interpretavel';

export interface RewardBaseNameAnalysis {
  state: NameAnalysisState;
  percentualNoNome: number | null; // ex.: 25 para "KIT 25%"
  temPercentualNoNome: boolean;
}

/** Vínculos/utilização de uma base (agregados em lote — sem N+1). */
export interface RewardBaseUsage {
  funcionarios: number;         // funcionários ativos com base_premiacao_id = base.id
  formulas: number;             // fórmulas de cálculo com base_premiacao_id (direto)
  categorias: number;           // categorias distintas (indireto via funcionários/fórmulas)
  resultadosHistoricos: number; // resultados salvos com esta base (snapshot)
  emUso: boolean;
  somenteHistorico: boolean;
  topCategorias: { nome: string; funcionarios: number }[];
  formulasNomes: string[];
}

export type RewardBaseStatusKind = 'regular' | 'revisar' | 'sem_vinculo' | 'config_incompleta';

export interface RewardBaseStatus {
  status: RewardBaseStatusKind;
  motivos: string[];
  descricao: string;
}

/** Linha enriquecida de base (base + análise + comportamento + uso + status). */
export interface RewardBaseRow {
  id: string;
  nome: string;
  descricao: string | null;
  tipo: RewardBaseTipo;
  valorBase: number;
  nameAnalysis: RewardBaseNameAnalysis;
  engine: EngineBehaviorInfo;
  usage: RewardBaseUsage;
  status: RewardBaseStatus;
  duplicado: boolean;
}

export interface RewardBaseFilters {
  search: string;
  tipo: 'todos' | RewardBaseTipo;
  utilizacao: 'todos' | 'em_uso' | 'sem_vinculo' | 'somente_historico';
  situacao: 'todos' | RewardBaseStatusKind;
}

export const DEFAULT_REWARD_BASE_FILTERS: RewardBaseFilters = {
  search: '', tipo: 'todos', utilizacao: 'todos', situacao: 'todos',
};

export type RewardBaseTab = 'todas' | 'em_uso' | 'sem_vinculo' | 'revisar';
