// Tipos da Central de Fórmulas de Premiação. Só contratos.
//
// Entidade `FormulaCalculo` (tabela `concremrh_formulas_calculo`): id, nome,
// descricao?, categoria_id?, base_premiacao_id?, 11 pesos (peso_*), multiplicador_kits,
// ativo, created_at, updated_at. Exclusão é SOFT (ativo=false). Sem versionamento.
//
// Seleção pelo motor (rewardsPreview): 1) categoria_id + base_premiacao_id (1º match
// vence); 2) fallback KITS (mesma categoria + base cujo nome começa com KIT);
// 3) fallback por NOME `"${categoria} - ${base}"`. Logo o NOME é chave textual de
// fallback. Duplicidade de (categoria,base) NÃO é bloqueada no banco → 1ª por nome
// vence silenciosamente. `multiplicador_kits` é decorativo (motor usa o nome da base).
// Resultados NÃO fazem snapshot da fórmula → editar afeta só processamentos futuros.
import type { WeightMap } from '../domain/rewardFormulaWeights';
import type { WeightValidation } from '../domain/rewardFormulaValidation';

export type FormulaStatusKind = 'regular' | 'incompleta' | 'revisar' | 'possivel_duplicidade';

export interface FormulaStatus {
  status: FormulaStatusKind;
  motivos: string[];
  descricao: string;
}

export interface FormulaUsage {
  funcionarios: number; // funcionários ativos na combinação (categoria_id, base_premiacao_id)
  emUso: boolean;
}

export interface RewardFormulaRow {
  id: string;
  nome: string;
  descricao: string | null;
  categoriaId: string | null;
  baseId: string | null;
  categoriaNome: string | null;
  baseNome: string | null;
  multiplicadorKits: number | null;
  weights: WeightMap;
  validation: WeightValidation;
  usage: FormulaUsage;
  status: FormulaStatus;
  duplicado: boolean; // outra fórmula ativa com a mesma (categoria_id, base_premiacao_id)
}

export interface RewardFormulaFilters {
  search: string;
  categoriaId: string;   // 'todos' | id
  baseId: string;        // 'todos' | id
  situacao: 'todos' | FormulaStatusKind;
  utilizacao: 'todos' | 'em_uso' | 'sem_vinculo';
}

export const DEFAULT_REWARD_FORMULA_FILTERS: RewardFormulaFilters = {
  search: '', categoriaId: 'todos', baseId: 'todos', situacao: 'todos', utilizacao: 'todos',
};

export type RewardFormulasView = 'formulas' | 'cobertura';

export type CoverageCellState = 'configurada' | 'incompleta' | 'sem_formula' | 'duplicada';

export interface CoverageCell {
  categoriaId: string;
  baseId: string;
  state: CoverageCellState;
  formulaIds: string[];
}
