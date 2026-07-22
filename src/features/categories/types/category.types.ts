// Tipos da Gestão de Categorias. Só contratos.
//
// Auditoria: entidade `Categoria` (tabela `concremrh_categorias`). Campos
// persistidos: id, nome, descricao?, cor?, ativo, created_at, updated_at. O
// formulário legado só edita `nome`. Exclusão é SOFT (ativo=false). Sem constraint
// de unicidade de nome no banco (duplicidade só na app).
//
// Relações reais (FK direta → concremrh_categorias):
//   - funcionarios.categoria_id  (direto)
//   - faixas.categoria_id        (direto)
//   - formulas_calculo.categoria_id (direto — configuração de premiação)
// Bases de premiação: relação apenas INDIRETA (via funcionários) — por isso NÃO
// vira coluna, só aparece no drawer rotulada como indireta.
//
// Uso no motor: `calculoPremiacao.ts` NÃO referencia categoria. Porém o NOME da
// categoria dirige regras de ELEGIBILIDADE na feature rewards-processing
// (CATEGORIAS_PREMIAVEIS = AUXILIAR/SUPERVISOR/ENCARREGADO; ramo de produção para
// SUPERVISOR/ENCARREGADO) e no filtro do Relatório. Renomear essas categorias
// pode afetar a premiação — alertar e NÃO alterar essas regras aqui.

export interface CategoryFaixaRef { id: string; nome: string; valor: number }

/** Vínculos/utilização de uma categoria (agregados em lote — sem N+1). */
export interface CategoryUsage {
  funcionarios: number;         // funcionários ativos com categoria_id = categoria.id
  faixas: number;               // faixas com categoria_id = categoria.id (direto)
  formulas: number;             // fórmulas de cálculo com categoria_id (direto)
  basesIndiretas: number;       // bases distintas dos funcionários (indireto)
  setoresIndiretos: number;     // setores distintos dos funcionários (indireto)
  resultadosHistoricos: number; // resultados salvos com o mesmo nome (snapshot)
  emUso: boolean;               // há funcionários ativos vinculados
  somenteHistorico: boolean;    // sem vínculo atual, mas com histórico
  premiavelPorNome: boolean;    // nome ∈ CATEGORIAS_PREMIAVEIS (regra textual)
  usadaEmPremiacao: boolean;    // premiável por nome OU com faixas/fórmulas ligadas
  faixasRef: CategoryFaixaRef[];    // faixas relacionadas (nome + valor)
  formulasNomes: string[];          // fórmulas relacionadas (nome)
  topBases: { nome: string; funcionarios: number }[];   // bases indiretas
  topSetores: { nome: string; funcionarios: number }[]; // setores indiretos
}

export type CategoryUtilizacao = 'em_uso' | 'sem_vinculo' | 'uso_historico';

/** Linha enriquecida de categoria (categoria + uso + duplicidade). */
export interface CategoryRow {
  id: string;
  nome: string;
  descricao: string | null;
  usage: CategoryUsage;
  utilizacao: CategoryUtilizacao;
  duplicado: boolean; // outra categoria com o mesmo nome normalizado (app-level)
}

export interface CategoryFilters {
  search: string;
  utilizacao: 'todos' | 'em_uso' | 'sem_funcionarios' | 'em_premiacao';
}

export const DEFAULT_CATEGORY_FILTERS: CategoryFilters = { search: '', utilizacao: 'todos' };
