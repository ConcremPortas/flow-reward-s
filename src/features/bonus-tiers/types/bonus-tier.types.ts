// Tipos da Central de Faixas de Premiação. Só contratos.
//
// Auditoria: entidade `Faixa` (tabela `concremrh_faixas`). Campos persistidos:
// id, nome, valor (numeric), categoria_id? (FK → categorias, ON DELETE SET NULL),
// ativo, created_at, updated_at. Exclusão é SOFT (ativo=false). Sem constraint de
// unicidade de nome no banco (duplicidade só na app).
//
// Uso no motor: o cálculo usa `funcionario.faixa?.valor` (número) via join; o NOME
// da faixa NÃO participa de nenhuma regra. Resultados salvos fazem SNAPSHOT de
// `valor_faixa` — editar o valor da faixa afeta apenas processamentos FUTUROS
// (resultados já salvos não são recalculados).

export type NameAnalysisState = 'sem_valor' | 'consistente' | 'divergente' | 'nao_interpretavel';

export interface NameAnalysis {
  state: NameAnalysisState;
  valorNoNome: number | null;   // valor detectado no texto do nome
  temValorNoNome: boolean;
}

/** Vínculos/utilização de uma faixa (agregados em lote — sem N+1). */
export interface TierUsage {
  funcionarios: number;         // funcionários ativos com faixa_id = faixa.id
  categorias: number;           // categorias distintas desses funcionários (indireto)
  bases: number;                // bases distintas desses funcionários (indireto)
  resultadosHistoricos: number; // resultados salvos com o mesmo nome de faixa (snapshot)
  emUso: boolean;
}

export type TierRegistrationStatusKind = 'regular' | 'revisar' | 'sem_vinculo';

export interface TierRegistrationStatus {
  status: TierRegistrationStatusKind;
  motivos: string[];
  descricao: string;
}

/** Linha enriquecida de faixa (faixa + análise de nome + uso + status). */
export interface BonusTierRow {
  id: string;
  nome: string;
  valor: number;
  categoriaId: string | null;
  nameAnalysis: NameAnalysis;
  usage: TierUsage;
  status: TierRegistrationStatus;
}

export interface BonusTierFilters {
  search: string;
  utilizacao: 'todos' | 'em_uso' | 'sem_vinculo';
  situacao: 'todos' | TierRegistrationStatusKind;
  valorZero: boolean;
  comDivergencia: boolean;
}

export const DEFAULT_TIER_FILTERS: BonusTierFilters = {
  search: '', utilizacao: 'todos', situacao: 'todos', valorZero: false, comDivergencia: false,
};

export type BonusTierTab = 'todas' | 'em_uso' | 'sem_vinculo' | 'revisar';
