// Tipos da Central de Relatório de Premiações. Só contratos.
//
// Auditoria de semântica (preservada, NÃO alterada):
// - bonus_possivel  = teto do período (bônus base + valor fixo).
// - bonus_alcancado = bônus base × nota geral + valor fixo (resultado do motor).
// - VALOR FINAL     = valor_ajustado ?? bonus_alcancado  → Final == Alcançado
//                     QUANDO NÃO há ajuste manual (coluna valor_ajustado nula).
// - DIFERENÇA       = Valor Final − Bônus Possível (negativo = perda de potencial).
// - "918" na tela legada = número de LINHAS (vínculos funcionário×base×competência),
//   NÃO funcionários únicos. Aqui distinguimos `resultados` de `funcionariosUnicos`.

export type ResultView = 'resultado' | 'criterios' | 'financeiro';

/** Estados possíveis de uma célula de critério — desambigua o "—" legado. */
export type CriterionStateKind = 'valor' | 'nao_aplicavel' | 'sem_dado' | 'sem_medicao' | 'erro';

export interface CriterionState {
  kind: CriterionStateKind;
  value: number | null;   // nota (0-1) quando kind === 'valor'
  label: string;          // rótulo curto ("N/A", "Sem dado", etc.) quando não é valor
  tooltip: string;        // explicação da origem
  tone: 'ok' | 'atencao' | 'impacto' | 'neutro';
}

export type CriterionKey =
  | 'producao' | 'faturamento' | 'epi' | 'dss' | 'faltas' | 'advertencias'
  | 'itens_nc' | 'tratamento_nc' | 'hora_maquina' | 'operacao_segura' | 'limpeza';

export interface FinancialTotals {
  resultados: number;         // linhas (vínculos)
  funcionariosUnicos: number; // funcionario_id distintos
  setores: number;
  bases: number;
  categorias: number;
  possivel: number;
  alcancado: number;
  final: number;
  ajustes: number;            // final − alcançado (soma dos ajustes manuais)
  diferenca: number;          // final − possível
  temAjustes: boolean;
  atingimento: number | null; // final / possível * 100 (null se possível <= 0)
  comBonus: number;
  semBonus: number;
}

export interface GroupRow {
  key: string;
  label: string;
  resultados: number;
  funcionariosUnicos: number;
  possivel: number;
  final: number;
  diferenca: number;
  atingimento: number | null;
}

/** Linha do funil de conciliação. */
export interface FunnelStep {
  key: string;
  label: string;
  value: number;
  kind: 'base' | 'delta' | 'resultado';
}

/** Impacto operacional por critério (não financeiro — não rastreável em R$). */
export interface CriterionImpact {
  key: CriterionKey;
  label: string;
  resultadosImpactados: number;  // nota < 1
  funcionariosUnicos: number;
  setores: number;
  notaMedia: number | null;
}

export interface DifferenceRow {
  id: string;
  nome: string;
  setor: string;
  possivel: number;
  final: number;
  diferenca: number;
}

export interface ReportInsight {
  code: string;
  type: 'positivo' | 'negativo' | 'atencao' | 'informativo';
  title: string;
  message: string;
}
