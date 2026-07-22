// Tipos da Central de Processamento de Premiações. Só contratos.
//
// Nota de auditoria (persistência): os resultados vivem em
// `concremrh_resultados_premiacao`, com escopo = (mes_competencia 'YYYY-MM-01' +
// base_premiacao_id). NÃO há coluna de categoria no escopo — categorias apenas
// filtram QUAIS funcionários entram. `salvarResultados` faz delete+insert por
// (competência, base). A competência circula como 'YYYY-MM' e vira 'YYYY-MM-01'
// só na fronteira de persistência (regra atual preservada).

/** Nota parcial de um critério, para exibição da memória de cálculo (observacional). */
export interface TraceEntry {
  key: string;
  label: string;
  entrada?: string | null;   // valor de entrada legível (ex.: "2 faltas", "R$ 1.000.000,00")
  nota?: number | null;      // nota do critério (0-1) quando aplicável
  peso?: number | null;      // peso da fórmula (0-1) quando aplicável
  contribuicao?: number | null; // nota * peso, quando aplicável
  observacao?: string | null;
}

/**
 * Resultado individual calculado (espelha a persistência de
 * `concremrh_resultados_premiacao`) + trace observacional. NÃO altera as regras;
 * é o mesmo objeto que a tela legada montava, com um `trace` derivado dos mesmos
 * valores intermediários.
 */
export interface RewardResult {
  id: string;               // funcionario_id
  cod_funcionario: string;
  nome: string;
  setor: string;
  funcao: string;
  faixa: string;
  categoria: string;
  valor_faixa: number;
  percentual_producao?: number;
  nota_producao?: number;
  nota_epi: number;
  nota_faltas: number;
  nota_advertencias: number;
  nota_dss: number;
  nota_faturamento?: number;
  nota_itens_nc?: number;
  nota_tratamento_nc?: number;
  nota_hora_maquina?: number;
  nota_operacao_segura?: number;
  nota_limpeza?: number;
  valor_kits?: number;
  nota_geral: number;
  bonus_possivel: number;
  bonus_alcancado: number;
  valor_fixo?: number;
  /** Observacional — não participa da decisão do cálculo. */
  trace: TraceEntry[];
  /** Sinalizações não-bloqueantes detectadas durante o cálculo (ex.: fórmula ausente). */
  flags: string[];
}

/** Resultado do cálculo de UMA base (sem persistir). */
export interface BasePreview {
  baseId: string;
  baseNome: string;
  tipo: 'producao' | 'kits' | 'outra';
  employees: RewardResult[];
  /** Motivo de a base não ter gerado resultados (ex.: sem funcionários). */
  skippedReason: string | null;
}

/** Resultado completo da prévia (todas as bases do escopo), em memória. */
export interface RewardsPreview {
  competencia: string;
  categoriaIds: string[];
  bases: BasePreview[];
  totals: PreviewTotals;
}

export interface PreviewTotals {
  funcionariosCalculados: number;
  comBonus: number;
  semBonus: number;
  valorTotal: number;       // soma de bonus_alcancado
  valorPossivelTotal: number; // soma de bonus_possivel
  valorMedio: number | null;
}

// ── Validação (preflight) ──────────────────────────────────────────────────

export type ValidationSeverity = 'pronto' | 'atencao' | 'bloqueio';

export interface ValidationAction {
  label: string;
  to: string; // rota (react-router) para corrigir a origem
}

export interface ValidationItem {
  code: string;
  severity: ValidationSeverity;
  title: string;
  description: string;
  affectedCount?: number;
  impact?: string;
  origin: string;
  action?: ValidationAction;
}

export interface ValidationGroup {
  key: 'parametros' | 'configuracao' | 'funcionarios' | 'competencia';
  label: string;
  items: ValidationItem[];
}

export interface ValidationResult {
  groups: ValidationGroup[];
  bloqueios: number;
  atencoes: number;
  prontos: number;
  canProceed: boolean; // sem bloqueios
}

// ── Processamento existente / comparação ────────────────────────────────────

export interface ExistingProcessing {
  competencia: string;
  baseId: string;
  baseNome: string;
  processadoEm: string | null;   // timestamp ISO (created/updated mais recente)
  resultados: number;
  valorTotal: number;
  categorias: string[];
}

export interface ComparisonRow {
  funcionarioId: string;
  nome: string;
  valorAnterior: number | null;
  valorNovo: number | null;
  diferenca: number | null;
}

export interface ComparisonResult {
  baseId: string;
  baseNome: string;
  valorAnterior: number;
  valorNovo: number;
  diferenca: number;
  funcionariosAlterados: number;
  rows: ComparisonRow[];
}

// ── Processamentos (histórico) ──────────────────────────────────────────────

export interface ProcessingRow {
  competencia: string;          // 'YYYY-MM'
  mesCompetencia: string;       // 'YYYY-MM-01'
  baseId: string;
  baseNome: string;
  categorias: string[];
  resultados: number;           // vínculos processados (linhas)
  funcionariosUnicos: number;   // pessoas distintas
  valorTotal: number;
  processadoEm: string | null;
  integridade: 'ok' | 'incompleto';
  problemas: string[];
}

// ── Inconsistências ─────────────────────────────────────────────────────────

export interface Issue {
  code: string;
  severity: 'bloqueio' | 'atencao';
  title: string;
  description: string;
  entidade: string;
  origin: string;
  competencia?: string;
  action?: ValidationAction;
}
