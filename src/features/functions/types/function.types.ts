// Tipos da Central de Funções. Só contratos.
//
// Auditoria: entidade `Funcao` (tabela `concremrh_funcoes`). Campos persistidos:
// id, nome, descricao?, nivel_hierarquico?, ativo, created_at, updated_at. O
// formulário legado só edita `nome`. Exclusão é SOFT (ativo=false). Sem constraint
// de unicidade de nome no banco (duplicidade só na app).
//
// Uso no motor de premiação: NENHUM. O cálculo (`src/domain/premiacao/
// calculoPremiacao.ts`) não referencia função por id nem por nome. Funcionários
// apontam para a função por `funcao_id` (FK → concremrh_funcoes). Resultados
// históricos guardam o NOME da função como snapshot textual (campo `funcao`).

/** Problemas de formatação detectáveis no próprio nome (determinístico). */
export type NameQualityIssueKind =
  | 'espacos_extremidades'
  | 'espacos_duplicados';

export interface NameQualityIssue {
  kind: NameQualityIssueKind;
  label: string;
}

export interface NameQuality {
  issues: NameQualityIssue[];
  hasIssues: boolean;
}

/** Vínculos/utilização de uma função (agregados em lote — sem N+1). */
export interface FunctionUsage {
  funcionarios: number;         // funcionários ativos com funcao_id = funcao.id
  setores: number;              // setores distintos desses funcionários (indireto)
  empresas: number;             // empresas distintas desses funcionários (indireto)
  categorias: number;           // categorias distintas desses funcionários (indireto)
  resultadosHistoricos: number; // resultados salvos com o mesmo nome (snapshot)
  emUso: boolean;               // há funcionários ativos vinculados
  somenteHistorico: boolean;    // sem vínculo atual, mas com histórico
  /** Principais setores (nome → nº de funcionários), ordem decrescente. */
  topSetores: { nome: string; funcionarios: number }[];
}

/** Tipo de semelhança entre dois nomes de função (observacional). */
export type SimilarityType =
  | 'accent_difference'
  | 'case_difference'
  | 'separator_difference'
  | 'normalization_difference'
  | 'token_equivalent'
  | 'similar_name';

export type SimilarityConfidence = 'high' | 'medium';

/** Correspondência de uma função para com OUTRA função (não afirma duplicidade). */
export interface SimilarityMatch {
  targetId: string;
  targetNome: string;
  targetFuncionarios: number;
  type: SimilarityType;
  confidence: SimilarityConfidence;
  /** Diferenças identificadas, em texto (ex.: "Acentuação", "Caixa"). */
  diffs: string[];
}

/** Grupo de funções semelhantes (mesma chave de comparação ou fuzzy). */
export interface SimilarityGroup {
  key: string;
  confidence: SimilarityConfidence;
  diffs: string[];
  members: {
    id: string;
    nome: string;
    funcionarios: number;
    setores: number;
  }[];
}

export type FunctionStatusKind = 'regular' | 'revisar' | 'possivel_correspondencia';

export interface FunctionRegistrationStatus {
  status: FunctionStatusKind;
  motivos: string[];
  descricao: string;
}

/** Linha enriquecida de função (função + qualidade + uso + similaridade + status). */
export interface FunctionRow {
  id: string;
  nome: string;
  descricao: string | null;
  nivelHierarquico: number | null;
  quality: NameQuality;
  usage: FunctionUsage;
  similar: SimilarityMatch[];
  duplicadoLiteral: boolean; // mesmo nome normalizado já existe (app-level)
  status: FunctionRegistrationStatus;
  setorIds: string[];        // setores vinculados (para o filtro por setor)
}

export interface FunctionFilters {
  search: string;
  utilizacao: 'todos' | 'em_uso' | 'sem_vinculo' | 'somente_historico';
  setorId: string; // 'todos' ou um setor_id
  situacao: 'todos' | FunctionStatusKind;
}

export const DEFAULT_FUNCTION_FILTERS: FunctionFilters = {
  search: '', utilizacao: 'todos', setorId: 'todos', situacao: 'todos',
};

export type FunctionTab = 'todas' | 'em_uso' | 'sem_vinculo' | 'revisar';
