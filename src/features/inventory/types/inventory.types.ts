/**
 * Tipos de domínio do módulo Controle de Estoque (Gestão de Fardamentos).
 * Camada PURA: nenhuma dependência de banco/UI. Campos de negócio em pt-BR,
 * alinhados ao contrato aprovado (Fase 2C) e ao schema `concremrh_estoque_*`.
 */

export type StockDirection = 'IN' | 'OUT';

/** Tipos de movimentação de estoque (rastreabilidade). */
export type MovementType =
  | 'ENTRADA'
  | 'AJUSTE_ENTRADA'
  | 'AJUSTE_SAIDA'
  | 'ENTREGA'
  | 'DEVOLUCAO'
  | 'ESTORNO_ENTREGA'
  | 'ESTORNO_DEVOLUCAO';

/** Tipos de entrega ao colaborador. */
export type DeliveryType =
  | 'ADMISSAO'
  | 'RENOVACAO'
  | 'DESGASTE'
  | 'TROCA_TAMANHO'
  | 'PERDA'
  | 'DANIFICACAO'
  | 'MUDANCA_SETOR'
  | 'EXTRAORDINARIA'
  | 'COMPRA';

export type ReturnCondition = 'NOVO' | 'BOM' | 'USADO' | 'DANIFICADO' | 'SEM_REUSO';
export type ReturnDestination = 'ESTOQUE' | 'HIGIENIZACAO' | 'MANUTENCAO' | 'BAIXA' | 'DESCARTE';

export type DeliveryStatus = 'CONFIRMADA' | 'CANCELADA';
export type ReturnStatus = 'ATIVA' | 'ESTORNADA';
export type TermStatus = 'RASCUNHO' | 'EMITIDO' | 'CONFIRMADO' | 'CANCELADO';

/** Situação de disponibilidade/alerta de um saldo. */
export type StockStatus = 'SEM_ESTOQUE' | 'ALERTA' | 'NORMAL';

/** Resultado de uma verificação de elegibilidade (com motivo quando negado). */
export interface EligibilityResult {
  ok: boolean;
  motivo?: string;
}

/** Cálculo de um ajuste de saldo por unidade (regra nova, corrigida). */
export interface AdjustmentResult {
  saldoAnterior: number;
  saldoNovo: number;
  diferenca: number;
  direcao: StockDirection;
  tipo: Extract<MovementType, 'AJUSTE_ENTRADA' | 'AJUSTE_SAIDA'>;
}

/** Linha de movimentação derivada (para persistência posterior via RPC). */
export interface MovementItem {
  varianteId: string;
  quantidade: number;
  direcao: StockDirection;
  saldoAnterior: number;
  saldoPosterior: number;
}
