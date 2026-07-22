// Tipos da Central de Regras de Premiação por Kits. Só contratos.
//
// Entidade `ConfiguracaoKits` (tabela `concremrh_configuracoes_kits`): id,
// vigencia_inicio ('YYYY-MM'), minimo_kits, incremento_faixa, bonus_base,
// bonus_por_faixa, max_faixas?, ativo, created_at, updated_at. Exclusão SOFT.
// Vigência é ÚNICA no banco (unique constraint → erro 23505).
//
// AUDITORIA CRÍTICA (preservado):
//   - Fórmula (motor, calcularComissao): realizado < minimo → 0; senão
//     bonus_base + Math.floor((realizado − minimo) / incremento) × bonus_por_faixa.
//     Sem teto de faixas — `max_faixas` NÃO é aplicado pelo motor (decorativo/legado).
//   - Seleção por competência (getConfigParaCompetencia): maior vigencia_inicio ≤
//     competência ('YYYY-MM'); sem anterior → o processamento usa FALLBACK_CONFIG
//     (10000/250/100/25).
//   - Resultados NÃO fazem snapshot da config → editar afeta só o FUTURO.

export type KitsConfigStateKind = 'programada' | 'atual' | 'historica';

export interface KitsConfigState {
  state: KitsConfigStateKind;
  label: string;
  variant: 'success' | 'warning' | 'neutral';
}

export interface KitsConfigPeriod {
  inicio: string;            // 'YYYY-MM' (vigencia_inicio)
  fim: string | null;        // 'YYYY-MM' do mês anterior à próxima vigência; null = em diante/atual
  emDiante: boolean;         // true quando não há próxima config
}

export interface KitsConfigUsage {
  competencias: number;      // competências processadas cobertas por esta config
  resultados: number;        // resultados de premiação nessas competências
  utilizada: boolean;
}

export interface KitsConfigRow {
  id: string;
  vigenciaInicio: string;    // 'YYYY-MM'
  minimoKits: number;
  incrementoFaixa: number;
  bonusBase: number;
  bonusPorFaixa: number;
  maxFaixas: number | null;  // stored; NÃO aplicado pelo motor atual
  createdAt: string | null;
  updatedAt: string | null;
  sentinela: boolean;        // vigência-sentinela ("regra inicial", ex.: 2000-01)
  period: KitsConfigPeriod;
  state: KitsConfigState;
  usage: KitsConfigUsage;
  duplicado: boolean;        // (defensivo) outra config ativa com a mesma vigência
}
